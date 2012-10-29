class MediaSource < ActiveRecord::Base
  attr_accessible :rating, :type, :url
  belongs_to :song
end
