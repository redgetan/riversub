class Video < ActiveRecord::Base
  attr_accessible :artist, :genre, :name, :metadata, :url

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
      :aspect_ratio => self.aspect_ratio,
      :uploader_url => self.uploader_url,
      :uploader_username => self.uploader_username,
      :duration => self.duration
    }
  end

  def url
    source_url  
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

  def uploader_url
    "http://www.youtube.com/user/#{self.metadata["data"]["uploader"]}"
  end

  def generate_token
    self.token = loop do
      random_token = SecureRandom.urlsafe_base64(8)
      break random_token unless self.class.where(token: random_token).exists?
    end
  end

  def published_repositories
    self.repositories.published  
  end

  def to_param
    self.token  
  end

end
