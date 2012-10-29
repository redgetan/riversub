class MediaSource < ActiveRecord::Base
  attr_accessible :rating, :type, :url
  belongs_to :song

  after_initialize do
    self.votes ||= 0
  end
end
