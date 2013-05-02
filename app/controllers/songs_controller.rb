class SongsController < ApplicationController

  def new
    @song = Song.new

    render :layout => false
  end

  def sub
    metadata = params[:song_metadata]

    @song = Song.new({
      :name => metadata[:data][:title],
      :metadata => metadata
    })

    @song.media_sources_attributes = [{:url => params[:media_url]}]

    if @song.save
      render :json => @song.serialize.to_json
    else
      render :json => { :error => @song.errors.messages }, :status => 403
    end

  end

  def show
    @song = Song.find params[:id]

    render :json => @song.serialize.to_json
  end

  def edit
    @song = Song.find params[:id]
    @media_sources = MediaSource.highest_voted(@song.id)
    respond_to :html
  end
end
