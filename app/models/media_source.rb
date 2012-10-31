class MediaSource < ActiveRecord::Base
  attr_accessible :votes, :media_type, :url
  belongs_to :song

  validates :media_type, :url, :presence => true

  scope :highest_voted, lambda { |song_id|
    where("song_id = ?",song_id).order("votes DESC").limit(3)
  }

  # http://stackoverflow.com/questions/328525/what-is-the-best-way-to-set-default-values-in-activerecord
  after_initialize do
    self.votes ||= 0 if self.has_attribute? :votes
  end

end
