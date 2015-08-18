class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.find_by_username(params[:username])

    @repositories = if user_signed_in? && current_user == @user
                      @user.repositories.includes(:video).recent # all
                    else
                      @user.repositories.includes(:video).published.recent # if not logged in, show only published ones
                    end
  end

end
