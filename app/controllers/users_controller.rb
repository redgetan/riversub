class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.find_by_username(params[:username])

    @repositories = if user_signed_in? && current_user == @user
                      @user.repositories # all
                    else
                      @user.repositories.published # if not logged in, show only published ones
                    end


      #doc.css("entry")[0].css("content")[0].attributes["lang"].value
  end
end
