class SongsController < ApplicationController

  def play
    song = Song.find params[:id]

    media_sources = MediaSource.highest_voted(song.id)

    render :json => {
      :media_sources => media_sources,
      :lyrics        => song.lyrics,
      :sync_file    => song.sync_file
    }
  end

  def new
    @song = Song.new

    render :layout => false
  end

  def create
    @song = Song.new params[:song]

    if @song.save
      render :json => { :song_id => @song.id }, :status => 200
    else
      render :json => { :error => @song.errors.messages }, :status => 403
    end

  end

  def show
    @post = Song.find params[:id]

    render :json => @post
  end

  def update
  end

end
