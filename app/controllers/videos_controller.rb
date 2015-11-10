class VideosController < ApplicationController

  def new
    @group_id = params[:group_id]
  end

  def show
    @video = Video.find_by_token! params[:token]
  end

  def prepare
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http").strip).first_or_initialize
    if !@video.ready?
      @video.save
      Delayed::Job.enqueue Video::DownloadSourceJob.new(@video, params[:source_download_url])
      render :json => { query_progress_url: @video.query_progress_url(@video) }
    else
      render :json => { new_repo_url: @video.new_empty_repository_url }
    end
  end

  def query_progress
    @video = Video.find_by_token! params[:token]

    if !@video.ready?
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
