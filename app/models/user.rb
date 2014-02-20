
class User < ActiveRecord::Base

  include ActiveModel::Validations

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :omniauthable, 
         :omniauth_providers => [:facebook]

  # Setup accessible (or protected) attributes for your model
  attr_accessible :login, :username, :bio, :email, :password, :password_confirmation, :remember_me,
                  :avatar, :avatar_cache, :remove_avatar

  validates :username, :presence => true


  has_many :repositories
  has_many :videos, :through => :repositories
  has_many :identities

  attr_accessor :login

  mount_uploader :avatar, AvatarUploader

  before_create do
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

  def serialize
    {
      :id => self.id,
      :username => self.username,
      :bio => self.bio,
      :email => self.email,
      :avatar => self.avatar
    }  
  end

  def to_param
    self.username  
  end
end
