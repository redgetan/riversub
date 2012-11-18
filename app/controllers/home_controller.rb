class HomeController < ApplicationController

  def index
    @songs_with_sync_files = Song.with_sync_files
    @songs_no_sync_files   = Song.no_sync_files

    respond_to :html
  end

end
