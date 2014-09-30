class HomeController < ApplicationController

  def index
    @guided_walkthrough_repo = Repository.guided_walkthrough
    @autoplay_repo =  Repository.homepage_autoplay_repo
    respond_to :html
  end

  def faq
    # @guided_walkthrough_repo = Repository.guided_walkthrough
  end

  def how_to_use
    
  end

  def about
    
  end

end
