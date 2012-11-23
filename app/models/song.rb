class Song < ActiveRecord::Base
  attr_accessible :artist, :genre, :lyrics, :name,
                  :media_sources_attributes
  has_many :media_sources
  has_many :sync_files

  validates :name, :lyrics, :presence => true

  accepts_nested_attributes_for :media_sources

  scope :with_sync_files, lambda {
    joins("LEFT JOIN sync_files ON songs.id = sync_files.song_id")
      .where("song_id IS NOT NULL")
  }

  scope :no_sync_files, lambda {
    joins("LEFT JOIN sync_files ON songs.id = sync_files.song_id")
      .where("song_id IS NULL")
  }

end
