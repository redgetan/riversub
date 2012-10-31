class HomeController < ApplicationController

  respond_to :html, :json

  def index
    @songs = Song.all
    respond_with @songs
  end

  def play
    song = Song.find params[:song_id]

    media_source = MediaSource.highest_voted(song.id)
    sync_file    = SyncFile.highest_voted(song.id)

    render :json => {
      :media_source => media_source,
      :lyrics     => song.lyrics,
      :sync_file  => sync_file
    }
  end
end
