class SyncFile < ActiveRecord::Base
  attr_accessible :votes, :timecode
  belongs_to :song

  validates :timecode, :presence => true

  scope :highest_voted, lambda { |song_id|
    where("song_id = ?",song_id).order("votes DESC").limit(3)
  }

  # http://stackoverflow.com/questions/328525/what-is-the-best-way-to-set-default-values-in-activerecord
  after_initialize do
    self.votes ||= 0 if self.has_attribute? :votes
  end

end
