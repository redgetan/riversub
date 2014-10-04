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


end
