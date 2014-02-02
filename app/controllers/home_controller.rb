class HomeController < ApplicationController

  def index
    @repos = Repository.all
    @guided_walkthrough_repo = Repository.guided_walkthrough
    respond_to :html
  end

  def videos
    @repos = Repository.all
    respond_to :html
  end

  def about
  end

  def how_it_works
  end

  def tutorial
  end

end
