class Song < ActiveRecord::Base
  attr_accessible :artist, :genre, :lyrics, :name,
                  :media_sources_attributes
  has_many :media_sources, :dependent => :destroy
  has_one :sync_file, :dependent => :destroy

  validates :name, :lyrics, :presence => true

  accepts_nested_attributes_for :media_sources

  before_save do
    # if first character of lyrics is not a newline, insert one
    # Now, all lyrics would start with blank line, period of start time where no lyrics is shown
    if self.lyrics[0] != "\n"
      self.lyrics = "\n#{self.lyrics}"
    end
  end

end
