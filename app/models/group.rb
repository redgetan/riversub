require 'elasticsearch/model'

class Group < ActiveRecord::Base

  include Rails.application.routes.url_helpers
  include PublicActivity::Model

  include Elasticsearch::Model
  include Elasticsearch::Model::Callbacks

  include ApplicationHelper
  include ActionView::Helpers::NumberHelper
  include ActionView::Helpers::TextHelper

  settings index: { number_of_shards: 1 } do
    mappings dynamic: 'false' do
      indexes :name, type: "string"
      indexes :description, type: "string"
    end
  end

  attr_accessible :description, :name, :creator, :creator_id, :short_name,
                  :avatar, :avatar_cache, :remove_avatar, :allow_subtitle_download

  mount_uploader :avatar, AvatarUploader
  acts_as_commentable


  tracked :only  => :create,
          :owner => Proc.new{ |controller, model| 
            model.class.respond_to?(:current_user) ? model.class.current_user : nil
          },
          :params => {
            :group_short_name => Proc.new { |controller, model| 
              model.short_name
            }
          }


  has_many :comments, :foreign_key => "commentable_id"
  has_many :memberships
  has_many :members, through: :memberships, class_name: "User", source: "user"

  has_many :repositories
  has_many :requests

  has_many :releases

  has_many :settings, class_name: "GroupSetting"

  belongs_to :creator, class_name: "User", foreign_key: "creator_id"

  validates :creator_id, :presence => true
  validates :name, :presence => true
  validates :short_name, :presence => true, :uniqueness => true
  validates :description, :presence => true
  validate :no_whitespace_short_name

  after_create :create_membership

  def self.find_by_short_id(short_id)
    self.find_by_short_name(short_id)  
  end

  def owners
    self.members.where("memberships.is_owner IS TRUE")
  end

  def moderators
    owners  
  end

  def non_moderators
    self.members.where("memberships.is_owner IS FALSE")
  end

  def pending_requests
    requests.includes(:video, :group).reject { |request| request.completed? } 
  end

  def translators
    self.repositories.published.map { |repo| repo.user }.uniq  
  end

  def no_whitespace_short_name
    if self.short_name =~ /\s/
      self.errors.add(:short_name, "cannot contain any whitespace")
    end
  end

  def is_member?(target_user)
    return false unless target_user
    target_user.groups.include? self  
  end

  def latest_release
    releases.published.order("created_at DESC").first
  end

  def description
    self.markeddown_description  
  end

  def description=(text)
    write_attribute(:description, text.to_s.rstrip)
    self.markeddown_description  = self.generated_markeddown_description
  end

  def generated_markeddown_description
    Markdowner.to_html(read_attribute(:description), dont_convert_headers_to_strong: true)
  end

  def past_releases
    releases.published - [latest_release]
  end

  def create_membership
    self.memberships.create!(user_id: self.creator.id, is_owner: true)  
  end

  def self.selection_options_for(user = nil)
    no_group    = ["None", nil]
    
    groups = if user 
                user.groups.map { |group|  [group.name,group.short_name] }
              else 
                self.all.map    { |group|  [group.name,group.short_name] }
              end

    groups.unshift(no_group)
  end

  def unimported_repositories_grouped_by_video
    unimported_repositories.group_by { |repo| repo.video }
  end

  def avatar_url
    avatar.thumb.url
  end

  def thumbnail_url_hq
    root_url_without_trailing_slash = root_url[0..-2]
    root_url_without_trailing_slash + avatar.url
  end

  def share_text
    "#{self.name} Subtitling Community"
  end

  def share_description
    truncate(self.description, length: 180)
  end

  def url(params = {})
    group_url(self, params)  
  end

  def releases_url
    group_releases_url(self)
  end

  def join_url
    join_group_url(self)  
  end

  def new_request_url
    new_group_request_url(self)
  end

  def create_request_url
    group_requests_url(self)
  end

  def published_repositories
    self.repositories.published  
  end

  def draft_repositories
    self.repositories.where(is_published: nil)  
  end

  def public_activities
    PublicActivity::Activity.where_params(group_short_name: self.short_name)
                            .order("created_at DESC")
  end

  def unimported_repositories
    self.repositories.published.unimported
  end

  def imported_repositories_grouped_by_video
    imported_repositories.group_by { |repo| repo.video }
  end

  def imported_repositories
    self.repositories.published.imported
  end

  def default_video_language_code
    self.short_name == "jpweekly" ? "ja" : nil
  end

  alias_method :orig_save, :save

  def save(*)
    super
  rescue ActiveRecord::RecordNotUnique => e
    self.errors.add(:short_name, "has already been taken")
    false
  end

  def serialize
    {
      :id => self.id,
      :name => self.name,
      :short_name => self.short_name,
      :description => self.description,
      :url => self.url
    }
  end

  def allow_subtitle_download 
    allow_subtitle_download_setting = settings.get(:allow_subtitle_download)
    allow_subtitle_download_setting.present? ? allow_subtitle_download_setting == "true" : true
  end

  def allow_subtitle_download=(bool) 
    settings.set(:allow_subtitle_download, bool)  
  end

  def requests_url(params = {})
    url(params) + "#requests"  
  end

  def user_submissions_url(params = {})
    url(params) + "#user_submissions"  
  end

  def members_url(params = {})
    url(params) + "#members"  
  end

  def request_category_select_options
    [
      ["Open",   requests_url(status: 'open'), ],
      ["Closed", requests_url(status: 'closed')]
    ]
  end

  def user_submission_category_select_options
    [
      ["Published",   user_submissions_url(repo_status: 'published'), ],
      ["In Progress", user_submissions_url(repo_status: 'draft')]
    ]
  end

  def is_moderator?(target_user)
    self.memberships.where(user_id: target_user.try(:id)).first.try(:is_moderator?)
  end

  def short_id
    self.short_name
  end

  def notify_subscribers_repo_published(repo)
    RepositoryMailer.group_repo_published_notify(repo,members).deliver      
  end

  def to_param
    self.short_name  
  end


end
