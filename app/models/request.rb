class Request < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  belongs_to :video
  belongs_to :group
  belongs_to :submitter, foreign_key: :submitter_id, class_name: "User"

  has_many :repositories

  attr_accessible :video_id, :submitter_id, :group_id, :video, :submitter, :group, :language,
                  :details

  validates :video_id, uniqueness: { scope: :group_id }

  before_create :set_submitter

  def set_submitter
    self.submitter_id = self.class.current_user.try(:id) unless self.submitter_id 
  end

  def new_repository_url
    self.video.new_repository_url(group_id: self.group.try(:short_name), 
                                  hide_group: group.present? ? true : nil,
                                  repo_language_code: self.language,
                                  request_id: self.id)  
  end

  def language_pretty
    ::Language::CODES[self.language]
  end

  def from_language_pretty
    ::Language::CODES[self.video.language]
  end

  def to_language_pretty
    language_pretty
  end

  def source_url
    self.video.source_url  
  end

  def source_embed_url
    self.video.source_embed_url  
  end

  def share_text
    "Can someone subtitle this video please"  
  end

  def completed?
    self.repositories.published.count > 0  
  end

  def completed_repository
    self.repositories.published.first  
  end

  def url
    group_request_url(self.group,self)  
  end

  def thumbnail_url_hq
    self.video.thumbnail_url_hq  
  end

  def share_description
    self.video.title
  end

  def title
    video.title  
  end


end