class VideosController < ApplicationController

  def sub
    metadata = params[:video_metadata]

    # if video already exist not need to create another one
    @video = Video.where(:url => params[:media_url])
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })
    #
    @repo = Repository.where(:user_id => current_user.try(:id), 
                             :video_id => @video.id)
                      .first_or_create!

    render :json => { :redirect_url => @repo.editor_url } 
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end

  def editor
    @user  = User.find_by_username params[:username]
    @video = Video.find_by_token   params[:token]

    @repo = Repository.where(:user_id => @user.try(:id), :video_id => @video.id).first

    respond_to :html
  end


  def show
    @user  = User.find_by_username params[:username]
    @video = Video.find_by_token   params[:token]

    @repo = Repository.where(:user_id => @user.try(:id), :video_id => @video.id).first
                      
    respond_to :html
  end

end
