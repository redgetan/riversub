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

  def assign_metadata(force = false)
    if force || self.metadata.nil?
      self.metadata = YoutubeClient.new.get_metadata(self.source_id)[0]
    end
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

  def source_url
    orig_source_url = super  
    orig_source_url =~ /^http:\/\// ? orig_source_url : orig_source_url.prepend("http://")
  end

  def source_embed_url
    "https://www.youtube.com/embed/#{source_id}"
  end

  def self.all_language_codes
    self.select("DISTINCT language").map(&:language).compact
  end

  def current_language
    language || "en"
  end

  def language_pretty
    ::Language::CODES[current_language]
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
    yt_duration_to_seconds(ytformat)
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

  def ask_source_language?
    self.language.blank?  
  end

  def title
    name
  end

  def url
    video_url(self)
  end

  def new_repository_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params) 
  end

  def new_empty_repository_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params.merge(empty: true)) 
  end

  def new_repository_via_upload_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params.merge(upload: true)) 
  end

  def translate_repository_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params) 
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
