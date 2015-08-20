class Identity < ActiveRecord::Base
  belongs_to :user
  has_one :page

  validates :user_id, :presence => true

  attr_accessible :uid, :provider, :user_id,  :token, :refresh_token, :expires_at, :yt_channel_id, :auth
  attr_accessor :auth

  before_create :set_oauth_tokens
  after_create  :set_yt_channel_id

  def set_oauth_tokens
    self.token         = auth["credentials"]["token"]
    self.refresh_token = auth["credentials"]["refresh_token"]
    self.expires_at    = auth["credentials"]["expires_at"]
  end

  def set_yt_channel_id
    self.update_column(:yt_channel_id, fetch_yt_channel_id)
  end

  def fetch_yt_channel_id
    get_channel_data_hash["id"]  
  end

  def channel_id
    yt_channel_id  
  end

  def get_channel_data_hash
    youtube_client.get_channel_data.data.items.first.to_hash
  end

  def youtube_client
    @youtube_client = get_youtube_client unless @youtube_client

    if @youtube_client.expired?
      @youtube_client.refresh!  

      # we need to save the new access token and expiry back to DB, refresh token is always the same so no need to save it
      self.update_attributes!(
        :token => @youtube_client.client.authorization.access_token,
        :expires_at => Time.now + @youtube_client.client.authorization.expires_in
      )
    end

    @youtube_client
  end

  def get_youtube_client
    YoutubeClient.new({
      access_token: access_token, 
      refresh_token: refresh_token, 
      expires_at: expires_at
    })
  end

  def self.find_with_omniauth(auth)
    if auth['provider'] == "google_oauth2"
      # build a temp identity instance
      temp_identity = self.new(auth: auth)
      temp_identity.set_oauth_tokens
      auth_channel_id = temp_identity.fetch_yt_channel_id
      where(provider: auth['provider'], yt_channel_id: auth_channel_id).first
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

    create!(uid: auth['uid'], provider: auth['provider'], user_id: user.id, auth: auth)
  end

  def self.find_or_create_with_omniauth!(auth)
    identity = self.find_with_omniauth(auth)
    return identity if identity

    self.create_with_omniauth!(auth)
  end

  def fix_insufficient_scopes!(auth)
    self.auth = auth
    self.set_oauth_tokens
    self.insufficient_scopes = ""
    self.save!
  end

  def access_token
    token  
  end
end
