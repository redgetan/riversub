class Song < ActiveRecord::Base
  attr_accessible :artist, :genre, :lyrics, :name,
                  :media_sources_attributes
  has_many :media_sources, :dependent => :destroy
  has_many :subtitles
  has_many  :timings

  validates :name, :lyrics, :presence => true

  accepts_nested_attributes_for :media_sources
  accepts_nested_attributes_for :subtitles

  def serialize
    {
      :id => self.id,
      :name => self.name,
      :genre => self.genre,
      :media_sources => self.media_sources.map(&:serialize),
      :subtitles => self.subtitles.map(&:serialize),
      :timings => self.timings.map(&:serialize)
    }
  end

end
