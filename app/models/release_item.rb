class ReleaseItem < ActiveRecord::Base
  attr_accessible :position, :release_id, :repository_id, :video_id
  
  belongs_to :release
  belongs_to :repository
  
end
