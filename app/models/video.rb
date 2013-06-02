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
      :url => self.url
    }
  end

  def generate_token
    self.token = loop do
      random_token = SecureRandom.urlsafe_base64(8)
      break random_token unless self.class.where(token: random_token).exists?
    end
  end

  def to_param
    self.token  
  end

end
