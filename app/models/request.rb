class Request < ActiveRecord::Base
  belongs_to :video
  belongs_to :group
  belongs_to :submitter, foreign_key: :submitter_id, class_name: "User"

  attr_accessible :video_id, :submitter_id, :group_id, :video, :submitter, :group, :language

  validates :video_id, uniqueness: { scope: :group_id }

  before_create :set_submitter

  def set_submitter
    self.submitter_id = self.class.current_user.try(:id) unless self.submitter_id 
  end

end