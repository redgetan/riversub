class HomeController < ApplicationController

  def index
    @group = Group.find_by_short_name("jpweekly")
    @activities = PublicActivity::Activity.order("created_at DESC").limit(6)
    @repos = Repository.includes({:timings => :subtitle}, :video, :user)
                       .where(language: "en").published.recent.limit(10)

    respond_to :html
  end

  def community_translations
    @repos = Repository.includes({:timings => :subtitle}, :video, :user)
                       .where(language: "en").published.recent.page params[:page]
  end

  def features
    
  end

  def faq
    # @guided_walkthrough_repo = Repository.guided_walkthrough
  end

  def how_to_use
    
  end

  def about
    
  end

end
