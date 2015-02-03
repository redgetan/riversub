class SessionsController < Devise::SessionsController

  before_filter :store_previous_url, :only => [:new]

  def new
    flash.now[:error] = "You must be logged in to #{params[:user_action].humanize.downcase}" if params[:user_action]  
    super
  end
end