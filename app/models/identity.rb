class Identity < ActiveRecord::Base
  belongs_to :user

  attr_accessible :uid, :provider, :user_id

  def self.find_with_omniauth(auth)
    where(provider: auth['provider'], uid: auth['uid']).first
  end

  def self.create_with_omniauth!(auth)
    # see if an existing user has same auth email, assume that this new identity belongs to that user 
    user = User.find_by_email(auth.info.email) || User.create_with_omniauth!(auth) 

    create!(uid: auth['uid'], provider: auth['provider'], user_id: user.id)
  end

  def self.find_or_create_with_omniauth!(auth)
    identity = self.find_with_omniauth(auth)
    return identity if identity

    self.create_with_omniauth!(auth)
  end
end
