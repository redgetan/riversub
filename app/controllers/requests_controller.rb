class RequestsController < ApplicationController
  def new
    if params[:group_id].present? && !user_signed_in?
      flash[:error] = "You must be logged in to request subtitles"
      store_location
      redirect_to new_user_session_url and return
    end

    @group_id = params[:group_id]
  end

  def create
    # if video already exist not need to create another one
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http"))
                  .first_or_create!

    # update video language if needed
    @video.update_attributes!(language: params[:video_language_code]) unless @video.language.present?

    @request = Request.new(video: @video, 
                           submitter: current_user, 
                           language: @repo_language_code, 
                           group_id: params[:group_id])


    if @request.save
      flash[:notice] = "Request added"
      render json: { redirect_url: @request.group.try(:url) || root_url }, status: :created 
    else
      render json: { error: @request.errors.full_messages.join(".") }, status: :unprocessable_entity 
    end
  rescue ActiveRecord::RecordNotUnique => e
      render json: { error: "Video has already been requested" }, status: :unprocessable_entity 
  end

end