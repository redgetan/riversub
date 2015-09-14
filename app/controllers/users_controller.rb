class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.includes(
      {:correction_requests_sent => [ :subtitle, :repository ]}, 
      {:correction_requests_received => [ :subtitle, :repository ]}
    ).find_by_username(params[:username])

    @repositories = if (user_signed_in? && current_user == @user) || @user.is_super_admin?
                      @user.repositories.includes(:video).recent # all
                    else
                      @user.repositories.includes(:video).published.recent # if not logged in, show only published ones
                    end

    @user_submissions_for_producer = if @user.youtube_channel_ids.present?
                                       Repository.includes(:video, :user, {:timings => :subtitle}).published.for_channel_id(@user.youtube_channel_ids) 
                                     else
                                       []
                                     end
  end

end
