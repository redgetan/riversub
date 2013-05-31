class VideosController < ApplicationController

  def new
    @video = Video.new

    render :layout => false
  end

  def sub
    metadata = params[:video_metadata]

    @video = Video.new({
      :name => metadata[:data][:title],
      :metadata => metadata,
      :url => params[:media_url]
    })

    if current_user
      @video.users << current_user
    end

    if @video.save
      if current_user
        render :json => { :redirect_url => editor_user_video_path(@user,@video) } 
      else
        render :json => { :redirect_url => editor_video_path(@video) } 
      end
    else
      render :json => { :error => @video.errors.messages }, :status => 403
    end

  end

  def editor
    @video = Video.find params[:id]

    respond_to :html
  end


  def show
    @video = Video.find params[:id]

    render :json => @video.serialize.to_json
  end

end
