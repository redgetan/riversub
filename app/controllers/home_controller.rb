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
    @guided_walkthrough_repo = Repository.guided_walkthrough
  end

end
