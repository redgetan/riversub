class Request < ActiveRecord::Base

  include Rails.application.routes.url_helpers
  
  include PublicActivity::Model

  tracked :only  => :create,
          :owner => Proc.new{ |controller, model| 
            model.class.respond_to?(:current_user) ? model.class.current_user : nil
          },
          :params => {
            :group_short_name => Proc.new { |controller, model| 
              model.group.short_name
            }
          }


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

  def self.pending
    self.joins("LEFT JOIN repositories on repositories.request_id = requests.id")
        .select("requests.*,COUNT(nullif(repositories.is_published,false)) as pub_count")
        .group("requests.id")
        .having("pub_count = 0")
  end

  def self.open
    self.pending  
  end

  def self.closed
    self.joins("LEFT JOIN repositories on repositories.request_id = requests.id")
        .select("requests.*,COUNT(nullif(repositories.is_published,false)) as pub_count")
        .group("requests.id")
        .having("pub_count > 0")
  end

  def completed?
    self.repositories.published.count > 0  
  end

  def public_activity_details
    details.present? ? details : "#{self.language_pretty} sub : #{self.video.name}"
  end

  def completed_repository
    self.repositories.published.first  
  end

  def completed_repositories
    self.repositories.published
  end

  def url
    group.present? ? group_request_url(self.group,self) : video_request_show_url(self) 
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

  def self.request_category_select_options
    [
      ["Open",   Rails.application.routes.url_helpers.video_request_index_url(status: 'open'), ],
      ["Closed", Rails.application.routes.url_helpers.video_request_index_url(status: 'closed')]
    ]
  end


end