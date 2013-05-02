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
end
