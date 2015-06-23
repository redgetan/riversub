class HomeController < ApplicationController

  def index
    @guided_walkthrough_repo = Repository.guided_walkthrough
    @autoplay_repo =  Repository.homepage_autoplay_repo
    @repository_counts_by_country = Repository.repository_counts_by_country
    @group = Group.find_by_short_name("jpweekly")
    @activities = PublicActivity::Activity.order("created_at DESC").limit(6)
    respond_to :html
  end

  def archives
    @group = Group.find_by_short_name("jpweekly")
    @group_repos = @group.published_repositories.where(language: "en").recent.page params[:page]
    @activities  = @group.public_activities.limit(3)

    render "groups/show"
  end

  def community_translations
    @repos = Repository.community_translations
  end

  def faq
    # @guided_walkthrough_repo = Repository.guided_walkthrough
  end

  def how_to_use
    
  end

  def about
    
  end

end
