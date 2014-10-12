class Group < ActiveRecord::Base
  attr_accessible :description, :name, :creator, :creator_id

  has_many :memberships
  has_many :members, through: :memberships, class_name: "User"

  has_many :group_repositories
  has_many :repositories, through: :group_repositories

  belongs_to :creator, class_name: "User", foreign_key: "creator_id"

  validates :creator_id, :presence => true

  after_create :create_membership

  def self.owners
    self.members.where(is_owner: true)
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

  def unimported_repositories
    self.repositories.published.unimported
  end

  def imported_repositories_grouped_by_video
    imported_repositories.group_by { |repo| repo.video }
  end

  def imported_repositories
    self.repositories.published.imported
  end


end
