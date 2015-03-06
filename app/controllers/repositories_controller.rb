class RepositoriesController < ApplicationController


  def new
    unless user_signed_in?
      flash[:error] = "You must be logged in to #{params[:upload] ? 'upload a subtitle' : 'add a language'}"
      store_location
      redirect_to new_user_session_url and return
    end

    @video = Video.find_by_token(params[:video_token])
    @is_upload = params[:upload].present?
  end

  def show
    @repo = Repository.find_by_token params[:token]

    unless can? :read, @repo
      if user_signed_in?
        flash[:error] = "You don't have permission to see that"
        redirect_to root_url and return
      else
        store_location
        redirect_to new_user_session_url and return
      end
    end

    @video = @repo.video
    @comment = @repo.comment_threads.build
    @comments = @repo.comment_threads.arrange_for_user(current_user)

    Comment.highlight_comment(@comments,params[:comment_short_id])
  end
  
  def create
    create_common
    @repo = Repository.create!(video: @video, user: current_user, language: @repo_language_code)
    @repo.update_column(:group_id, params[:group_id]) if params[:group_id].present?
    redirect_to @repo.editor_url
  end

  def upload
    if params[:subtitle_file].blank?
      flash[:error] = "Upload File can't be blank"
      redirect_to :back and return
    end

    create_common

    begin
      @repo = Repository.create_from_subtitle_file!(video: @video, 
                                                    user: current_user, 
                                                    language: @repo_language_code, 
                                                    subtitle_file: params[:subtitle_file])
    rescue SubtitleParser::InvalidFormatError => e
      flash[:error] = "Uploaded file is not in proper SubRip format. #{e.message}"
      redirect_to :back and return
    end

    @repo.update_column(:group_id, params[:group_id]) if params[:group_id].present?
    redirect_to @repo.editor_url
  end

  def publish
    @repo = Repository.find_by_token! params[:token]

    if @repo.update_attributes!(is_published: true)
      respond_to do |format|
        format.html  { redirect_to @repo.url  }
        format.json  { render :json => { :redirect_url => @repo.url }, :status => 200 }
      end
    else
      render :json => { :error => @repo.errors.full_messages }, :status => 403
    end
  end

  def update_title
    @repo = Repository.find_by_token! params[:token]

    if @repo.update_attributes!(title: params[:repo_title])
      respond_to do |format|
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

    unless can? :edit, @repo
      if user_signed_in?
        flash[:error] = "You don't have permission to see that"
        redirect_to root_url and return
      else
        store_location
        redirect_to new_user_session_url and return
      end
    end

    respond_to :html
  end

  def index
    if params[:country_code]
      @repos = Repository.includes(timings: :subtitle).published.for_country(params[:country_code]).recent.page params[:page]
    else
      @repos = Repository.includes(timings: :subtitle).published.recent.page params[:page]
    end
  end

  def unpublished
    unless current_user && current_user.admin?
     redirect_to new_user_session_url and return
    end

    @repos = Repository.unpublished.recent
  end


  def unvote
    if !(repo = find_repo)
      return render :text => "can't find repo", :status => 400
    end

    repo.unvote_by current_user

    render :text => "ok"
  end

  def upvote
    if !(repo = find_repo)
      return render :text => "can't find repo", :status => 400
    end

    unless current_user
      store_location(repo.url)
      render :text => new_user_session_url, :status => 401 and return
    end

    repo.liked_by current_user

    render :text => "ok"
  end

  def downvote
    if !(repo = find_repo)
      return render :text => "can't find repo", :status => 400
    end

    unless current_user
      store_location(repo.url)
      render :text => new_user_session_url, :status => 401 and return
    end

    if !current_user.can_downvote?(repo)
      return render :text => "not permitted to downvote", :status => 400
    end

    repo.disliked_by current_user

    render :text => "ok"
  end

  private

    def find_repo
      Repository.where(:token => params[:id]).first
    end

    def create_common
      @video_language_code = params[:video_language_code].present? ? params[:video_language_code] : nil
      @repo_language_code  = params[:repo_language_code].present?  ? params[:repo_language_code]  : nil

      @video = Video.find_by_token(params[:video_token])
      @video.update_attributes!(language: @video_language_code) if @video_language_code
    end

end