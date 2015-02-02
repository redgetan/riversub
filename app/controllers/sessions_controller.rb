class SessionsController < Devise::SessionsController
  def new
    flash.now[:error] = "You must be logged in to #{params[:user_action].humanize.downcase}" if params[:user_action]  
    super
  end
end