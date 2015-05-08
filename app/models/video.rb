class Video < ActiveRecord::Base

  has_paper_trail :on => [:update, :destroy]

  include Rails.application.routes.url_helpers

  attr_accessor :current_user
  attr_accessible :artist, :genre, :name, :metadata, :url, :source_url, :language, :current_user

  has_many :repositories
  has_many :users, :through => :repositories

  has_many :releases
  has_many :release_items, :through => :releases

  serialize :metadata, JSON

  before_validation :assign_metadata

  validate :correct_metadata 

  before_create :generate_token

  def correct_metadata
    unless self.metadata && self.source_id
      errors.add(:base, "Url is not a valid youtube link.")
    end
  end

  def assign_metadata
    part = "snippet,contentDetails,statistics"
    response = RestClient.get "https://www.googleapis.com/youtube/v3/videos?part=#{part}&id=#{self.source_id}&key=#{GOOGLE_API_KEY}"
    self.metadata = JSON.parse(response)["items"][0]
  end

  def serialize
    {
      :id => self.id,
      :name => self.name,
      :genre => self.genre,
      :url => self.url,
      :source_url => self.source_url,
      :duration => self.duration
    }
  end

  def self.all_language_codes
    self.select("DISTINCT language").map(&:language).compact
  end

  def source_id
    # http://stackoverflow.com/a/9102270
    match = self.source_url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/)
    (match && match[2].length == 11) ? match[2] : nil
  end

  def view_count
    return 0 unless self.metadata
    self.metadata["statistics"]["viewCount"]  
  end

  def duration
    return 0 unless self.metadata
    ytformat = self.metadata["contentDetails"]["duration"] # youtube video duration
    # youtube duration format comes in the form of PT1H41M17S
    match = ytformat.match(/PT(\d{0,2}?)H*(\d{0,2}?)M*(\d{0,2})S/)
    match[1].to_i * 3600 + match[2].to_i * 60 + match[3].to_i
  end

  def uploader_username
    return "unavailable" unless self.metadata
    self.metadata["snippet"]["channelTitle"]
  end

  def name
    return "Video unavailable" unless self.metadata
    self.metadata["snippet"]["title"]  
  end

  def thumbnail_url
    return "" unless self.metadata
    self.metadata["snippet"]["thumbnails"]["default"]["url"]
  end

  def thumbnail_url_hq
    return "" unless self.metadata
    self.metadata["snippet"]["thumbnails"]["high"]["url"]
  end

  def generate_token
    self.token = loop do
      random_token = SecureRandom.urlsafe_base64(8)
      break random_token unless self.class.where(token: random_token).exists?
    end
  end

  def empty_repository?(target_user)
    !repositories.select { |repo| repo.visible_to_user?(target_user) }.present?
  end

  def repositories_visible_to_user(target_user)
    repositories.select { |repo| repo.visible_to_user?(target_user) }
  end

  def title
    name
  end

  def url
    video_url(self)
  end

  def new_repository_url
    video_repository_new_url(self) 
  end

  def new_empty_repository_url
    video_repository_new_url(self) + "?empty=true" 
  end

  def new_repository_via_upload_url
    video_repository_new_url(self) + "?upload=true"
  end

  def translate_repository_url
    video_repository_new_url(self) 
  end

  def published_repositories
    self.repositories.published
  end

  def self.language_select_options
    Language::CODES.map{|k,v| [v,k]}.unshift(["Unknown",""])
  end

  def self.selected_language_select_for(group)
    group.settings.get("default_video_language_code")
  end

  def to_param
    self.token
  end

end
