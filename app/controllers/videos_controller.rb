class VideosController < ApplicationController

  def new
    @video = Video.new

    render :layout => false
  end

  def sub
    metadata = params[:video_metadata]

    @video = Video.new({
      :name => metadata[:data][:title],
      :metadata => metadata
    })

    @video.media_sources_attributes = [{:url => params[:media_url]}]

    if @video.save
      render :json => @video.serialize.to_json
    else
      render :json => { :error => @video.errors.messages }, :status => 403
    end

  end

  def show
    @video = Video.find params[:id]

    render :json => @video.serialize.to_json
  end

  def edit
    @video = Video.find params[:id]
    @media_sources = MediaSource.highest_voted(@video.id)
    respond_to :html
  end
end
