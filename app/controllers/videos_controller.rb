class VideosController < ApplicationController

  def new
    @group_id = params[:group_id]
  end

  def show
    @video = Video.find_by_token! params[:token]
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
