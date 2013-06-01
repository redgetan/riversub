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

    render :json => { :redirect_url => @repo.url } 
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end

  def editor
    @repo = Repository.where(:user_id => params[:user_id],
                             :video_id => params[:id]).first

    respond_to :html
  end


  def show
    @video = Video.find params[:id]

    render :json => @video.serialize.to_json
  end

end
