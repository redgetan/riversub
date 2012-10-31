class Song < ActiveRecord::Base
  attr_accessible :artist, :genre, :lyrics, :name
  has_many :media_sources
  has_many :sync_files

  validates :name, :lyrics, :presence => true

end
