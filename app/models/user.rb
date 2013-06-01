
class User < ActiveRecord::Base

  include ActiveModel::Validations

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :login, :username, :bio, :email, :password, :password_confirmation, :remember_me,
                  :avatar, :avatar_cache, :remove_avatar

  validates :username, :presence => true


  has_many :repositories
  has_many :videos, :through => :repositories

  attr_accessor :login

  mount_uploader :avatar, AvatarUploader

  before_save do
    self.username.downcase! 
  end

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    if login = conditions.delete(:login)
      where(conditions).where(["lower(username) = :value OR lower(email) = :value", { :value => login.downcase }]).first
    else
      where(conditions).first
    end
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
end
