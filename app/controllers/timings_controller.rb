class TimingsController < ApplicationController
  def create
    @video = Video.find params[:video_id]

    @timings = []
    params[:timings].each do |i,timing_param|
      @timing = @video.timings.create(timing_param)
      unless @timing
        render :json => { :error => @timing.errors.messages, :created => @timings.map(&:serialize).to_json }, :status => 403 and return
      end
      @timings << @timing
    end

    render :json => @timings.map(&:serialize).to_json, :status => 200

  end

  def update
    @video = Video.find params[:video_id]

    @timings = []
    params[:timings].each do |i,timing_param|
      id = timing_param.delete(:id)
      @timing = @video.timings.find(id)
      sucess = @timing.update_attributes(timing_param)
      unless sucess
        render :json => { :error => @timing.errors.messages, :updated => @timings.map(&:serialize).to_json }, :status => 403 and return
      end
      @timings << @timing
    end

    render :json => @timings.map(&:serialize).to_json, :status => 200
  end

  def destroy
    @video = Video.find params[:video_id]
    params[:timings].each do |id|
      @timing = @video.timings.find(id)
      @timing.delete
    end
    render :json => {}, :status => 200
  end

  def index
    @video = Video.find params[:video_id]
    send_data @video.to_srt, :type => "text/plain", :filename => "#{@video.name}.srt"
  end
end
