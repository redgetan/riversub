class Request < ActiveRecord::Base
  belongs_to :video
  belongs_to :group
  belongs_to :submitter, foreign_key: :submitter_id, class_name: "User"

  has_many :repositories

  attr_accessible :video_id, :submitter_id, :group_id, :video, :submitter, :group, :language

  validates :video_id, uniqueness: { scope: :group_id }

  before_create :set_submitter

  def set_submitter
    self.submitter_id = self.class.current_user.try(:id) unless self.submitter_id 
  end

  def new_repository_url
    self.video.new_repository_url(group_id: self.group.try(:id), 
                                  hide_group: group.present? ? true : nil,
                                  repo_language_code: self.language,
                                  request_id: self.id)  
  end

  def language_pretty
    ::Language::CODES[self.language]
  end

  def completed?
    self.repositories.published.count > 0  
  end

  def completed_repository
    self.repositories.published.first  
  end


end