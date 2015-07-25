require 'google/api_client'

class User < ActiveRecord::Base

  has_paper_trail :on => [:update, :destroy]

  include ActiveModel::Validations
  include Rails.application.routes.url_helpers

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :omniauthable, 
         :omniauth_providers => [:google_oauth2]

  acts_as_voter   

  has_many :votes, class_name: "ActsAsVotable::Vote", foreign_key: "voter_id"

  # Setup accessible (or protected) attributes for your model
  attr_accessible :login, :username, :bio, :email, :password, :password_confirmation, :remember_me,
                  :avatar, :avatar_cache, :remove_avatar, :role

  validates :username, :presence => true


  has_many :repositories
  has_many :videos, :through => :repositories
  has_many :identities
  has_many :pages, :through => :identities
  has_many :settings, class_name: "UserSetting"

  has_many :memberships
  has_many :groups, through: :memberships

  has_many :group_creations, class_name: "Group", foreign_key: "creator_id"

  attr_accessor :login, :role

  mount_uploader :avatar, AvatarUploader

  ROLES = %w[youtuber translator viewer]

  before_create do
    self.username.downcase!
  end

  def self.roles_select_options
    ROLES.map do |role_name|
      [role_name.capitalize,role_name]
    end  
  end

  def self.recent_contributors(num_of_entries = 10)
    joins(:repositories).where("repositories.id IN (?)",
                                Repository.recent_user_subtitled_published_ids(num_of_entries))
  end

  def self.find_first_by_auth_conditions(warden_conditions)
    conditions = warden_conditions.dup
    if login = conditions.delete(:login)
      where(conditions).where(["lower(username) = :value OR lower(email) = :value", { :value => login.downcase }]).first
    else
      if conditions[:username].nil?
        where(conditions).first
      else
        where(username: conditions[:username]).first
      end
    end
  end

  def self.create_with_omniauth!(auth) 
    user = self.new
    user.email             = auth.info.email
    user.password          = Devise.friendly_token[0,20]
    user.username          = normalized_and_unique_username(auth.info.name)   
    user.remote_avatar_url = large_image_size(auth) 
    user.save!
    user
  end

  def self.large_image_size(auth)
    if auth.provider == "facebook"
      "#{auth.info.image}?type=large"
    else
      auth.info.image
    end
  end

  def self.normalized_and_unique_username(username)
    username = self.normalize_username(username)
    self.ensure_uniqueness_of_username(username)
  end

  def self.normalize_username(username)
    username.split("\s").join("_").downcase
  end

  def self.ensure_uniqueness_of_username(username)
    i = 0
    # ensure uniqueness of username
    while self.find_by_username(username)
      i += 1
      username = "#{username}_#{i}"
    end

    username
  end

  def role=(role_name)
    case role_name
    when "youtuber"  
      self.is_producer = true
    when "translator"  
      self.is_translator = true
    when "viewer"
    end
  end

  def page
    pages.first  
  end

  def avatar_url
    avatar.thumb.url
  end

  def url
    user_url(self)
  end

  def youtube_identity
    @youtube_identity ||= self.identities.where(provider: "google_oauth2").first
  end

  def youtube_account_connected?
    youtube_identity.try(:access_token).present?
  end

  def serialize
    {
      :id => self.id,
      :username => self.username,
      :bio => self.bio,
      :email => self.email,
      :avatar => self.avatar
    }  
  end

  def registered?
    self.username.present?    
  end

  def admin?
    !!self.is_admin  
  end

  alias_method :orig_save, :save

  def save(*)
    super
  rescue ActiveRecord::RecordNotUnique => e
    self.errors.add(:username, "has already been taken")
    false
  end

  # used for lobster comments (might need changing in future)
  def is_moderator?
    is_admin?  
  end

  def translations_tab_class
    self.repositories.published.present? ? "active" : ""
  end
  
  def video_bookmarks_tab_class
    self.repositories.published.present? ? "" : "active"
  end

  def can_downvote?(obj)
    true
  end

  def video_bookmarks
    self.votes.where(votable_type: "Repository").map(&:votable)
  end

  def line_favorites
    self.votes.where(votable_type: "Subtitle").map(&:votable)
  end

  def allow_subtitle_download 
    settings.get(:allow_subtitle_download)  == "true"
  end

  def allow_subtitle_download=(bool) 
    settings.set(:allow_subtitle_download, bool)  
  end

  def youtube_connect!(auth)
    # create identity + store oauth tokens
    identity = Identity.find_or_create_with_omniauth!(auth)
  end

  def to_param
    self.username  
  end
end
