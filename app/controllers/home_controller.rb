class HomeController < ApplicationController

  def index
    @videos = Video.all
    respond_to :html
  end

end
