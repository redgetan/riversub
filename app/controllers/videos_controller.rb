class VideosController < ApplicationController

  def sub
    metadata = params[:video_metadata]

    # if video already exist not need to create another one
    @video = Video.where(:url => params[:media_url].gsub(/https/,"http"))
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })

    @repo = if current_user
              Repository.where(:user_id => current_user.id,
                               :video_id => @video.id)
                        .create!
            else
              Repository.create!(:video_id => @video.id)
            end

    render :json => { :redirect_url => @repo.editor_setup_url } 
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end

  def publish
    @repo = Repository.find_by_token! params[:token]

    if @repo.update_attributes!(is_published: true)
      render :json => {}, :status => 200
    else
      render :json => { :error => @repo.errors.full_messages }, :status => 403
    end
  end

  def setup
    @repo = Repository.find_by_token! params[:token]
    
    if @repo.language.present?
      redirect_to @repo.editor_url and return
    end

    @repo_fork = Repository.find_by_token(params[:forked_repo_token]) || @repo.other_published_repositories.first
  end

  def finish_setup
    @repo = Repository.find_by_token! params[:token]  
    @repo.update_attributes!(language: params[:language_code])

    if params[:copy_timing_from].present?
      @repo.copy_timing_from!(params[:copy_timing_from]) 
    end
    
    redirect_to @repo.editor_url
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

    if @repo.is_published
      respond_to :html
    else
      render :text => "Video is not published" , :status => 404
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
