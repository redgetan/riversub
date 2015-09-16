class HomeController < ApplicationController

  def index
    @group = Group.find_by_short_name("jpweekly")
    @activities = PublicActivity::Activity.order("created_at DESC").limit(6)
    @repos = Repository.includes({:timings => :subtitle}, :video, :user)
                       .where("language <> 'ja'").published.recent.limit(5)

    respond_to :html
  end

  def community_translations
    @groups = Group.ordered_by_number_of_repositories
    @repos = Repository.includes({:timings => :subtitle}, :video, :user)
                       .where("language <> 'ja'").published.recent.page params[:page]
  end

  def search
    @repos = Repository.search_query(params[:q]).page params[:page]
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
