class Video < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  attr_accessible :artist, :genre, :name, :metadata, :url, :language

  has_many :repositories
  has_many :users, :through => :repositories

  serialize :metadata, JSON

  validates :name, :presence => true

  before_create :generate_token

  def serialize
    {
      :id => self.id,
      :name => self.name,
      :genre => self.genre,
      :url => self.url,
      :source_url => self.source_url,
      :aspect_ratio => self.aspect_ratio,
      :uploader_url => self.uploader_url,
      :uploader_username => self.uploader_username,
      :duration => self.duration
    }
  end

  def self.all_language_codes
    self.select("DISTINCT language").map(&:language).compact
  end

  def aspect_ratio
    self.metadata["data"]["aspectRatio"]
  end

  def duration
    self.metadata["data"]["duration"] # youtube video duration
  end

  def uploader_username
    self.metadata["data"]["uploader"]
  end

  def thumbnail_url
    self.metadata["data"]["thumbnail"]["sqDefault"]
  end

  def thumbnail_url_hq
    self.metadata["data"]["thumbnail"]["hqDefault"]
  end

  def uploader_url
    "http://www.youtube.com/user/#{self.metadata["data"]["uploader"]}"
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

  def title
    name
  end

  def url
    video_url(self)
  end

  def new_repository_url
    video_repository_new_url(self) 
  end

  def new_repository_via_upload_url
    video_repository_new_url(self) + "?upload=true"
  end

  def published_repositories
    self.repositories.published
  end

  def to_param
    self.token
  end

end
