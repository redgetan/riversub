class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.find_by_username(params[:username])

    if @user.is_producer? 
      if !user_signed_in?
        flash[:error] = "You must be logged in to view that"
        store_location
        redirect_to new_user_session_url and return
      end

      if current_user != @user
        flash[:error] = "You are not authorized to view that"
        redirect_to root_url and return
      end
    end

    @repositories = if user_signed_in? && current_user == @user
                      @user.repositories.includes(:video).recent # all
                    else
                      @user.repositories.includes(:video).published.recent # if not logged in, show only published ones
                    end

    @page = @user.pages.build
  end

end
