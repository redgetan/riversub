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

    if @video.save
      render :json => { :redirect_url => videos_editor_path(@video) } 
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
