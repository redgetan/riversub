class TimingsController < ApplicationController
  def create
    @song = Song.find params[:song_id]

    @timings = []
    params[:timings].each do |i,timing_param|
      @timing = @song.timings.create(timing_param)
      unless @timing
        render :json => { :error => @timing.errors.messages, :created => @timings.map(&:serialize).to_json }, :status => 403 and return
      end
      @timings << @timing
    end

    render :json => @timings.map(&:serialize).to_json, :status => 200

  end

  def update
    @song = Song.find params[:song_id]

    @timings = []
    params[:timings].each do |i,timing_param|
      id = timing_param.delete(:id)
      @timing = @song.timings.find(id)
      sucess = @timing.update_attributes(timing_param)
      unless sucess
        render :json => { :error => @timing.errors.messages, :updated => @timings.map(&:serialize).to_json }, :status => 403 and return
      end
      @timings << @timing
    end

    render :json => @timings.map(&:serialize).to_json, :status => 200
  end

  def destroy
    @song = Song.find params[:song_id]
    params[:timings].each do |id|
      @timing = @song.timings.find(id)
      @timing.delete    
    end
    render :json => {}, :status => 200
  end

  def index
    @song = Song.find params[:song_id]
    send_data @song.to_srt, :type => "text/plain", :filename => "#{@song.name}.srt"
  end
end
