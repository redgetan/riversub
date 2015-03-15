class Group < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  attr_accessible :description, :name, :creator, :creator_id, :short_name

  has_many :memberships
  has_many :members, through: :memberships, class_name: "User", source: "user"

  has_many :repositories

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

  def no_whitespace_short_name
    if self.short_name =~ /\s/
      self.errors.add(:short_name, "cannot contain any whitespace")
    end
  end

  def latest_release
    releases.published.order("created_at DESC").first
  end

  def create_membership
    self.memberships.create!(user_id: self.creator.id)  
  end

  def self.selection_options_for(user)
    no_group    = ["None", nil]
    user_groups = user.groups.map { |group|  [group.name,group.id] }

    user_groups.unshift(no_group)
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
