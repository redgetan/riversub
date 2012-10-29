class SyncFile < ActiveRecord::Base
  attr_accessible :rating, :timecodes
  belongs_to :song
end
