class HomeController < ApplicationController

  def index
    @group = Group.find_by_short_name("jpweekly")
    @activities = PublicActivity::Activity.order("created_at DESC").limit(6)
    @repos = Repository.includes({:timings => :subtitle}, :video, :user)
                       .where("language <> 'ja'").published.listed_in_index.recent.limit(5)
    @autoplay_repo =  Repository.homepage_autoplay_repo

    respond_to :html
  end

  def community_translations
    @groups = Group.ordered_by_latest_release_date
    @repos = Repository.includes({:timings => :subtitle}, :video, :user)
                       .where("language <> 'ja'").published.listed_in_index.recent.page params[:page]
  end

  def unclassified_translations
    @repos = Repository.includes({:timings => :subtitle}, :video, :user)
                       .where("language <> 'ja'").published.listed_in_index
                       .unclassified
                       .recent.page params[:page]
  end

  def search
    @repos = Repository.search_query(params[:q]).page params[:page]
  end

  def how_it_works
    
  end

  def faq
    # @guided_walkthrough_repo = Repository.guided_walkthrough
  end

  def how_to_use
    
  end

  def about
    
  end

end
