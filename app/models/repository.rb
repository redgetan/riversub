class Repository < ActiveRecord::Base
  belongs_to :video
  belongs_to :user

  attr_accessible :video_id, :user_id
end
