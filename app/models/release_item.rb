class ReleaseItem < ActiveRecord::Base
  attr_accessible :position, :release_id, :video_id
  
  belongs_to :release
  has_one :repository

  def group
    release.group
  end
  
end
