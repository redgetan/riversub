class RepositoriesController < ApplicationController


  def new
    @video = Video.find_by_token(params[:video_token])
    @video.current_user = current_user

    @group = Group.find_by_short_name params[:group_id]
    @group_id = @group.try(:short_name)

    @page = Page.find_by_short_name params[:page_id]
    @page_id = @page.try(:short_name)

    @is_upload = params[:upload].present?
    @is_empty  = params[:empty].present?

    @video_language_code  = params[:video_language_code]
    @repo_language_code   = params[:repo_language_code]
    @hide_group           = params[:hide_group] || current_user.try(:groups).try(:count).to_i == 0
    @request_id           = params[:request_id]

    if !(@is_upload || @is_empty) && params[:source_repo_token]
      @source_repo = Repository.find_by_token! params[:source_repo_token] 
    end
  end

  def show
    @repo = Repository.find_by_token! params[:token]

    unless @repo.is_published?
      redirect_to @repo.editor_url and return 
    end

    @related_repos = Repository.includes(:user, :video).related(@repo)

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
    @comments = @repo.comment_threads.includes(:user).arrange_for_user(current_user)

    if params[:fullscreen]
      @repo.is_fullscreen = true
    end

    if params[:subtitle_short_id]
      @repo.highlight_subtitle_short_id = params[:subtitle_short_id] 
    end

    Comment.highlight_comment(@comments,params[:comment_short_id])
  end

  def embed
    @repo = Repository.find_by_token! params[:token]
    @repo.is_embed = true

    if can?(:read, @repo)
      render layout: false
    else
      render :text => "You don't have permission to see that" 
    end
  end
  
  def create
    create_common
    @repo = Repository.create!(video: @video, 
                               user: current_user, 
                               language: @repo_language_code,
                               request_id: params[:request_id])

    @group = Group.find_by_short_name params[:group_id]

    if @group && can?(:edit, @group)
      @repo.update_column(:group_id, @group.id) 
    end

    @page = Page.find_by_short_name params[:page_id]

    @repo.update_column(:page_id, @page.id) if @page

    if params[:source_repo_token].present?
      source_repo = Repository.find_by_token params[:source_repo_token]
      @repo.setup_translation!(source_repo) 
    end


    redirect_to @repo.editor_url
  end

  def fork
    @source_repo = Repository.find_by_token! params[:token]  
    @target_repo = Repository.create!(video: @source_repo.video, user: current_user)

    @target_repo.copy_timing_from!(@source_repo) 
    
    redirect_to @target_repo.editor_url
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
    rescue SRT::File::InvalidError => e
      flash[:error] = e.message
      redirect_to :back and return
    end

    @group = Group.find_by_short_name params[:group_id]
    @repo.update_column(:group_id, @group.id) if @group

    redirect_to @repo.editor_url
  end

  def upload_to_existing_repo

    @repo = Repository.find_by_token! params[:token]

    unless user_signed_in? && can?(:edit, @repo)
      flash[:error] = "You don't have permission to do that"
      redirect_to @repo.editor_url and return
    end

    if params[:subtitle_file].blank?
      flash[:error] = "Upload File can't be blank"
      redirect_to @repo.editor_upload_tab_url and return
    end

    begin
      @repo.create_timings_from_subtitle_file params[:subtitle_file]
    rescue SRT::File::InvalidError => e
      flash[:error] = e.message
      redirect_to @repo.editor_upload_tab_url and return
    rescue ActiveRecord::RecordInvalid => e
      flash[:error] = e.message
      redirect_to @repo.editor_upload_tab_url and return
    end

    redirect_to @repo.editor_url
  end

  def publish
    @repo = Repository.find_by_token! params[:token]

    if !user_signed_in? 
      render :json => { :error => "You must be signed in to publish" }, :status => 403 and return
    elsif cannot?(:edit, @repo)
      render :json => { :error => "You dont have permission to publish" }, :status => 403 and return
    end

    @repo.publish!

    respond_to do |format|
      format.html  { redirect_to @repo.url  }
      format.json  { render :json => { :redirect_url => @repo.post_publish_url }, :status => 200 }
    end
  end

  def update_title
    @repo = Repository.find_by_token! params[:token]

    unless can? :edit, @repo
      flash[:error] = "You don't have permission to do that"
      if user_signed_in?
        redirect_to @repo.editor_url and return
      else
        redirect_to root_url and return
      end
    end

    if @repo.update_attributes!(title: params[:repo_title])
      respond_to do |format|
        format.json  { render :json => {}, :status => 200 }
      end
    else
      render :json => { :error => @repo.errors.full_messages }, :status => 403
    end
  end

  def import_to_youtube
    @repo = Repository.find_by_token! params[:token]

    unless can? :import, @repo
      flash[:error] = "You don't have permission to do that"
      redirect_to :back and return
    end

    @repo.import_caption_to_youtube!
    flash[:notice] = "Subtitle successfully added to Youtube"
    redirect_to :back

  rescue YoutubeClient::InsufficientPermissions
    flash[:error] = "You need to let your Youtube account grant more permission in order to import the caption"
    redirect_to @repo.page.status_url
  rescue YoutubeClient::ImportCaptionError
    flash[:error] = "Unable to import caption. We're currently taking a look and will contact you shortly."
    redirect_to :back
  end

  def editor
    @repo = Repository.includes(:timings => :subtitle).find_by_token! params[:token]
    @repo.current_user = current_user
    
    if !user_signed_in? 
      flash[:notice] = "Demo mode. Any changes you make won't be saved. Sign in or create an account in order to save your changes in the editor."
    elsif cannot?(:edit, @repo) && @repo.group.present?
      flash[:notice] = "Read only mode. You can't edit someone else subtitle. Any changes you make won't be saved. Sign in or create an account in order to save your changes in the editor."
    elsif cannot?(:edit, @repo)
      flash[:error] = "You don't have permission to see that"
      redirect_to root_url and return
    end

    # http://stackoverflow.com/a/14428894
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

    respond_to :html
  end

  def index
    if params[:country_code]
      @repos = Repository.includes(timings: :subtitle).published.for_country(params[:country_code]).recent.page params[:page]
    elsif params[:username]
      @user = User.find_by_username(params[:username])
      @repos = Repository.where(user_id: @user.id).includes(timings: :subtitle).published.recent.page params[:page]
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

  def sync_to_youtube
    
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