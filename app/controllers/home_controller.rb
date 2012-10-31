class HomeController < ApplicationController

  respond_to :html, :json

  def index
    @songs = Song.all
    respond_with @songs
  end

  def play
    song = Song.find params[:song_id]

    media_sources = MediaSource.highest_voted(song.id)
    sync_files    = SyncFile.highest_voted(song.id)

    render :json => {
      :media_sources => media_sources,
      :lyrics     => song.lyrics,
      :sync_files  => sync_files
    }
  end
end
