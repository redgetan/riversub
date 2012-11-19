class SongsController < ApplicationController

  def play
    song = Song.find params[:id]

    media_sources = MediaSource.highest_voted(song.id)
    sync_files    = SyncFile.highest_voted(song.id)

    render :json => {
      :media_sources => media_sources,
      :lyrics        => song.lyrics,
      :sync_files    => sync_files
    }
  end

  def new
    @song = Song.new

    render :layout => false
  end

  def create
    @song = Song.new params[:song]

    unless @song.save
      render :json => { :error => @song.errors.messages }, :status => 403 and return
    end

    @media_source = @song.media_sources.build(
      :url => params[:media_url],
      :media_type => "video"
    )

    if @media_source.save
      render :json => { :song_id => @song.id }, :status => 200
    else
      render :json => { :error => @media_source.errors.messages }, :status => 403
    end

  end

  def show
    @post = Song.find params[:id]

    render :json => @post
  end

  def update
  end

end
