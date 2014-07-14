class UsersController < ApplicationController
  def show
    @user = User.find_by_username(params[:username])

    @repositories = if user_signed_in? && current_user == @user
                      @user.repositories # all
                    else
                      @user.repositories.published # if not logged in, show only published ones
                    end
  end
end
