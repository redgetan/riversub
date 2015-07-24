class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController

  def omniauth
    redirect_to root_url if signed_in?

    auth = request.env['omniauth.auth']
    @identity = Identity.find_or_create_with_omniauth!(auth)
    sign_in_and_redirect @identity.user, event: :authentication
  end

  def facebook;      omniauth; end

  # not used for login but for connecting youtube account of producers to yasub
  # so that we can display their videos and manage their captions
  def google_oauth2
    youtube_connect
  end

  def youtube_connect
    auth = request.env['omniauth.auth']
    @identity = Identity.find_or_create_with_omniauth!(auth)
    @identity.update_attributes!({
      token: auth["credentials"]["token"],
      refresh_token: auth["credentials"]["refresh_token"],
      expires_at: auth["credentials"]["expires_at"]
    })
    session['access_token'] = auth["credentials"]["token"]
    redirect_to current_user.url
  end

  def after_omniauth_failure_path_for(scope)
    if request.path =~ "google_oauth2"
      # for google/youtube omniauth, since we're already logged in, 
      # if oauth fails, it should redirect to user page instead 
      # where "youtube connect" button can be found
      current_user.url
    else
      new_session_path(scope)
    end
  end

end