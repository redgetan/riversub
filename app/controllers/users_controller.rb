class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.includes(
      {:correction_requests_sent => [ :subtitle, :repository ]}, 
      {:correction_requests_received => [ :subtitle, :repository ]}
    ).find_by_username(params[:username])

    @repositories = if (user_signed_in? && current_user == @user) || current_user.try(:is_super_admin?)
                      @user.repositories.includes(:video).recent # all
                    else
                      @user.repositories.includes(:video).published.recent # if not logged in, show only published ones
                    end

    @user_submissions_for_producer = if @user.youtube_channel_ids.present?
                                       Repository.includes(:video, :user, {:timings => :subtitle}).published.for_channel_id(@user.youtube_channel_ids) 
                                     else
                                       []
                                     end

    @comment = @user.comment_threads.build
    @comments = @user.comment_threads.includes(:user).arrange_for_user(current_user)
    Comment.highlight_comment(@comments,params[:comment_short_id])

  end

end
