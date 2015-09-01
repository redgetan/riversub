class CorrectionRequest < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  belongs_to :repository
  belongs_to :subtitle
  belongs_to :approver, class_name: "User"
  belongs_to :requester, class_name: "User"

  attr_accessible :correction_text, :subtitle_id, :repository_id, :approver_id, :requester_id

  before_create :set_original_text
  after_create :notify_approver

  def set_original_text
    self.original_text = self.subtitle.text  
  end

  def notify_approver
    RepositoryMailer.subtitle_correction_notify(self).deliver  
  end

  def formatted_diff
    original = self.subtitle.text
    current  =  self.correction_text
    Differ.diff_by_word(current, original).format_as(:html)
  end

  def submitter
    requester.present? ? requester.username : "Anonymous"  
  end

  def submitter_url
    requester.present? ? requester.url : ""  
  end

  def status
    case self.is_approved
    when true
      "approved"
    when false
      "rejected"
    when nil
      "pending"
    end
  end

  def action_required?
    self.is_approved == nil  
  end

  def approve
    # need to use update_attributes as opposed to update_column 
    # for paper_trail version row to be created
    self.subtitle.update_attributes(:text => self.correction_text)
    update_column(:is_approved, true)  
    update_column(:approved_at, Time.now)  
  end

  def reject
    update_column(:is_approved, false)  
    update_column(:rejected_at, Time.now)  
  end

  def approve_url
    approve_correction_request_url(self)  
  end

  def reject_url
    reject_correction_request_url(self)  
  end

end