class VideosController < ApplicationController

  def new
  end

  def show
    @video = Video.find_by_token params[:token]
  end

  def sub
    metadata = params[:video_metadata]

    # if video already exist not need to create another one
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http"))
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })

    render :json => { :redirect_url => @video.new_empty_repository_url }
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end


end
