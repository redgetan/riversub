class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.find_by_username(params[:username])

    @repositories = if user_signed_in? && current_user == @user
                      @user.repositories.includes(:video).recent # all
                    else
                      @user.repositories.includes(:video).published.recent # if not logged in, show only published ones
                    end

    @user_submissions_for_producer = if @user.youtube_channel_ids.present?
                                       Repository.includes(:video, :user, {:timings => :subtitle}).for_channel_id(@user.youtube_channel_ids) 
                                     else
                                       []
                                     end
  end

end
