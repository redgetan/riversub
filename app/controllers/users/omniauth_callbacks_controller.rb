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
    if identity = Identity.find_with_omniauth(auth)
      flash[:error] = "Youtube account #{identity.page.source_url} was already previously connected. If you're trying to link multiple youtube accounts, make sure to log out from youtube first before linking another account."
      redirect_to new_page_url and return
    end
    identity = current_user.youtube_connect!(auth)
    Page.create!(short_name: identity.yt_channel_id, identity_id: identity.id)
    flash[:notice] = "Successfully connected youtube account"
    redirect_to current_user.url
  end

  def google_oauth2_reconnect
    auth = request.env['omniauth.auth']

    identity = Identity.find_with_omniauth(auth)

    page_id = CGI.parse(CGI.unescape(params["state"]))["page_id"].first
    page = Page.find_by_id page_id

    if (page.identity != identity) 
      # if identity didnt match, it means the account is not the same as what's linked to the page before
      flash[:error] = "The Youtube Account you selected didn't match the account that was previously linked to the page. " + 
                      "Make sure you select the correct youtube account"
    else
      identity.fix_insufficient_scopes!(auth)
      flash[:notice] = "Permission successfully granted. "
    end

    redirect_to page.status_url
  end

  def after_omniauth_failure_path_for(scope)
    if request.path =~ /google_oauth2/
      # for google/youtube omniauth, since we're already logged in, 
      # if oauth fails, it should redirect to user page instead 
      # where "youtube connect" button can be found
      current_user.url
    else
      new_session_path(scope)
    end
  end

end