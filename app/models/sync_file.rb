class SyncFile < ActiveRecord::Base
  attr_accessible :votes, :timecode
  belongs_to :song

  after_initialize do
    self.votes ||= 0
  end

end
