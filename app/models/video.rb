class Video < ActiveRecord::Base
  attr_accessible :artist, :genre, :name, :metadata
                  :media_sources_attributes
  has_many :media_sources, :dependent => :destroy
  has_many :subtitles
  has_many :timings

  has_many :repositories
  has_many :users, :through => :repositories

  serialize :metadata, JSON

  validates :name, :presence => true

  accepts_nested_attributes_for :media_sources
  accepts_nested_attributes_for :subtitles

  def serialize
    {
      :id => self.id,
      :name => self.name,
      :genre => self.genre,
      :media_sources => self.media_sources.map(&:serialize),
      :timings => self.timings.map(&:serialize)
    }
  end

  def to_srt
    self.timings.order("start_time").each_with_index.map do |timing,index|
      # get subtitle each subtitle
      "#{index + 1}\n#{timing.formatted_start_time} --> #{timing.formatted_end_time}\n#{timing.subtitle.text}\n\n"
    end.join
  end

end
