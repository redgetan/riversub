class Video < ActiveRecord::Base
  attr_accessible :artist, :genre, :name, :metadata, :url

  has_many :repositories
  has_many :users, :through => :repositories

  serialize :metadata, JSON

  validates :name, :presence => true

  def serialize
    {
      :id => self.id,
      :name => self.name,
      :genre => self.genre,
      :url => self.url
    }
  end

end
