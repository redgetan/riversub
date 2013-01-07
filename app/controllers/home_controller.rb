class HomeController < ApplicationController

  def index
    @songs = Song.all
    respond_to :html
  end

end
