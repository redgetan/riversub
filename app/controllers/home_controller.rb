class HomeController < ApplicationController

  def index
    @guided_walkthrough_repo = Repository.guided_walkthrough
    @autoplay_repo =  Repository.homepage_autoplay_repo
    @repository_counts_by_country = Repository.repository_counts_by_country
    @group = Group.find_by_short_name("jpweekly")
    @activities = PublicActivity::Activity.all
    respond_to :html
  end

  def archives
    @group = Group.find_by_short_name("jpweekly")  
    render "groups/show"
  end

  def faq
    # @guided_walkthrough_repo = Repository.guided_walkthrough
  end

  def how_to_use
    
  end

  def about
    
  end

end
