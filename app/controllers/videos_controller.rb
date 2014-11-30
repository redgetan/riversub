class VideosController < ApplicationController

  def new
  end

  def sub
    metadata = params[:video_metadata]

    # if video already exist not need to create another one
    @video = Video.where(:url => params[:media_url].gsub(/https/,"http"))
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })

    @repo = Repository.create!(video: @video, user: current_user)

    render :json => { :redirect_url => @repo.editor_url } 
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end

  def publish
    @repo = Repository.find_by_token! params[:token]

    if @repo.update_attributes!(is_published: true)
      respond_to do |format|
        format.html  { redirect_to @repo.url  }
        format.json  { render :json => {}, :status => 200 }
      end
    else
      render :json => { :error => @repo.errors.full_messages }, :status => 403
    end
  end

  def fork
    @source_repo = Repository.find_by_token! params[:token]  
    @target_repo = Repository.create!(video: @source_repo.video, user: current_user)

    @target_repo.copy_timing_from!(@source_repo) 
    
    redirect_to @target_repo.editor_url
  end

  def editor
    @repo = Repository.find_by_token! params[:token]

    unless @repo.owned_by? current_user
      render :text => "you do not have permission to edit the subtitles", :status => 403 and return
    end

    respond_to :html
  end


  def show
    @repo = Repository.find_by_token! params[:token]

    if @repo.visible_to_user?(current_user)
      respond_to :html
    else
      render_404
    end
  end

  def index
    @repos = Repository.includes(timings: :subtitle).published.recent.page params[:page]
  end

  def unpublished
    unless current_user && current_user.admin?
      render :text => "you do not have permission to access that page", :status => 403 and return
    end

    @repos = Repository.unpublished.recent
  end

end
