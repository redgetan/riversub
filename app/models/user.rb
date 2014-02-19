
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

  attr_accessor :login

  mount_uploader :avatar, AvatarUploader

  before_save do
    self.username.downcase! 
  end

  def self.find_for_facebook_oauth(auth)
    where(auth.slice(:provider, :uid)).first_or_create do |user|
      user.provider = auth.provider
      user.uid = auth.uid
      user.email = auth.info.email
      user.password = Devise.friendly_token[0,20]
      user.name = auth.info.name   # assuming the user model has a name
      user.image = auth.info.image # assuming the user model has an image
    end
  end

  def self.new_with_session(params, session)
    super.tap do |user|
      if data = session["devise.facebook_data"] && session["devise.facebook_data"]["extra"]["raw_info"]
        user.email = data["email"] if user.email.blank?
      end
    end
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

  def to_param
    self.username  
  end
end
