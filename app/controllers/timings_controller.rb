class TimingsController < ApplicationController
  def create
    @repo = Repository.find params[:repository_id]

    @timings = []
    params[:timings].each do |i,timing_param|
      @timing = @repo.timings.create(timing_param)
      unless @timing
        render :json => { :error => @timing.errors.messages, :created => @timings.map(&:serialize).to_json }, :status => 403 and return
      end
      @timings << @timing
    end

    render :json => @timings.map(&:serialize).to_json, :status => 200

  end

  def update
    @repo = Repository.find params[:repository_id]

    @timings = []
    params[:timings].each do |i,timing_param|
      id = timing_param.delete(:id)
      @timing = @repo.timings.find(id)
      sucess = @timing.update_attributes(timing_param)
      unless sucess
        render :json => { :error => @timing.errors.messages, :updated => @timings.map(&:serialize).to_json }, :status => 403 and return
      end
      @timings << @timing
    end

    render :json => @timings.map(&:serialize).to_json, :status => 200
  end

  def destroy
    @repo = Repository.find params[:repository_id]
    params[:timings].each do |id|
      @timing = @repo.timings.find(id)
      @timing.delete
    end
    render :json => {}, :status => 200
  end

  def index
    @repo = Repository.find params[:repository_id]
    send_data @repo.to_srt, :type => "text/plain", :filename => "#{@repo.name}.srt"
  end

end
