class Group < ActiveRecord::Base

  include Rails.application.routes.url_helpers
  include PublicActivity::Model

  attr_accessible :description, :name, :creator, :creator_id, :short_name


  tracked :only  => :create,
          :owner => Proc.new{ |controller, model| 
            model.class.respond_to?(:current_user) ? model.class.current_user : nil
          },
          :params => {
            :group_short_name => Proc.new { |controller, model| 
              model.short_name
            }
          }


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

  def owners
    self.members.where("memberships.is_owner IS TRUE")
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

  def past_releases
    releases.published - [latest_release]
  end

  def create_membership
    self.memberships.create!(user_id: self.creator.id)  
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

  def url
    group_url(self)  
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

  def to_param
    self.short_name  
  end


end
