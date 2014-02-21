class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def omniauth
    redirect_to root_url if signed_in?

    auth = request.env['omniauth.auth']
    @identity = Identity.find_or_create_with_omniauth!(auth)
    sign_in_and_redirect @identity.user, event: :authentication
  end

  def facebook;      omniauth; end
  def google_oauth2; omniauth; end
end