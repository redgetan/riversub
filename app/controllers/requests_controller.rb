class RequestsController < ApplicationController

  def index
    @requests = if params[:status] == "open"
                  Request.includes(:group, :video, :submitter).pending.recent
                elsif params[:status] == "closed"
                  Request.includes(:group, :video, :submitter).closed.recent
                else
                  Request.includes(:group, :video, :submitter).pending.recent
                end
  end

  def new
    @group = Group.find_by_short_name params[:group_id]

    if !user_signed_in?
      flash[:error] = "You must be logged in to request subtitles"
      store_location
      redirect_to new_user_session_url and return
    end

    if @group && cannot?(:edit, @group)
      flash[:error] = "You must be a member of #{@group.name} to add requests to the topic"
      redirect_to @group.url
    end
  end

  def create
    @group = Group.find_by_short_name params[:group_id]

    if !(params[:source_url].match(/youtu\.?be/) || params[:source_url].match(/vimeo.com/) || params[:source_url].match(/nicovideo.jp/) || params[:source_url].match(/tvcast.naver.com/))
      flash[:error] = "Only youtube, naver, nicovideo, and vimeo urls are allowed"
      render :new and return
    end

    # if video already exist not need to create another one
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http"))
                  .first_or_create!

    # update video language if needed
    @video.update_attributes!(language: params[:video_language_code]) unless @video.language.present?

    @request = Request.new(video: @video, 
                           submitter: current_user, 
                           language: params[:request_language_code],
                           details:  params[:details],
                           group: @group)

    if @request.save
      flash[:notice] = "Request added"
      redirect_to (@group.try(:url) || video_request_index_url)
    else
      flash[:error] = @request.errors.full_messages.join(".")
      render :new and return 
    end
  rescue ActiveRecord::RecordNotUnique => e
      flash[:error] = "Video has already been requested"
      render :new 
  end

  def show
    @group = Group.find_by_short_name params[:group_id]
    @request = Request.find params[:id]
    
  end

end