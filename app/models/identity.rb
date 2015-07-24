class Identity < ActiveRecord::Base
  belongs_to :user

  attr_accessible :uid, :provider, :user_id,  :token, :refresh_token, :expires_at

  def self.find_with_omniauth(auth)
    if auth['provider'] == "google_oauth2"
      # for youtube oauth, user is already logged in, so we simply check against user_id instead of uid
      where(provider: auth['provider'], user_id: current_user.try(:id)).first
    else
      where(provider: auth['provider'], uid: auth['uid']).first
    end
  end

  def self.create_with_omniauth!(auth)
    if auth['provider'] == "google_oauth2"
      # for youtube oauth, user is already logged in
      user = current_user
    else
      # see if an existing user has same auth email, assume that this new identity belongs to that user 
      user = User.find_by_email(auth.info.try(:email)) || User.create_with_omniauth!(auth) 
    end

    create!(uid: auth['uid'], provider: auth['provider'], user_id: user.id)
  end

  def self.find_or_create_with_omniauth!(auth)
    identity = self.find_with_omniauth(auth)
    return identity if identity

    self.create_with_omniauth!(auth)
  end

  def access_token
    token  
  end
end
