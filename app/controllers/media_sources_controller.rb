class MediaSourcesController < ApplicationController
  def new
    @video = Video.find params[:video_id]
    @media_source = @video.media_sources.build
    render :layout => false
  end

  def create
    @video = Video.find params[:video_id]
    @media_source = @video.media_sources.build(:url => params[:url])

    if @media_source.save
      render :json => { :media_source_url => @media_source.url }, :status => 200
    else
      render :json => { :error => @media_source.errors.messages }, :status => 403
    end
  end
end
