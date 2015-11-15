class VideosController < ApplicationController

  skip_before_filter :verify_authenticity_token, :only =>[:prepare]

  def new
    @group_id = params[:group_id]
  end

  def show
    @video = Video.find_by_token! params[:token]
  end

  def prepare
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http").strip).first_or_create!

    if @video.ready?
      render :json => { new_repo_url: @video.new_empty_repository_url }
    elsif @video.download_in_progress?
      render :json => { query_progress_url: @video.query_progress_url(@video) }
    elsif 
      @video.start_download(params[:source_download_url], params[:cookie])

      render :json => { query_progress_url: @video.query_progress_url(@video) }
    end
  end

  def ready_state
    @video = Video.find_by_token! params[:token]
    if @video.ready?
      render :json => { ready_state: "ready", new_repo_url: @video.new_empty_repository_url }
    elsif @video.download_in_progress?
      render :json => { ready_state: "download_in_progress", progress: @video.download_progress }
    else
      render :json => { ready_state: "not_ready" }
    end
  end

  def query_progress
    @video = Video.find_by_token! params[:token]

    if @video.download_failed?
      render :json => { failed: "true" }
    elsif @video.download_in_progress?
      render :json => { progress: @video.download_progress }
    else
      render :json => { new_repo_url: @video.new_empty_repository_url }
    end
  end

  def sub
    # if video already exist not need to create another one
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http").strip)
                  .first_or_create!

    render :json => { :redirect_url => @video.new_empty_repository_url(group_id: params[:group_id], hide_group: params[:hide_group], page_id: params[:page_id])}
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end


end
