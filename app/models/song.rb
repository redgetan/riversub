class Song < ActiveRecord::Base
  attr_accessible :artist, :genre, :lyrics, :name,
                  :media_sources_attributes
  has_many :media_sources, :dependent => :destroy
  has_one :sync_file, :dependent => :destroy

  validates :name, :lyrics, :presence => true

  accepts_nested_attributes_for :media_sources

end
