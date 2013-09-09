class TimingsController < ApplicationController

  before_filter :get_repository

  def create
    @timing = @repo.timings.build(params[:timing])
    if @timing.save
      render :json => @timing.to_json, :status => 200
    else
      render :json => { :error => @timing.errors }, :status => 403
    end
  end

  def update
    @timing = @repo.timings.find(params[:id])
    if @timing.update_attributes(params[:timing])
      render :json => @timing.to_json, :status => 200
    else
      render :json => { :error => @timing.errors }, :status => 403
    end
  end

  def destroy
    @timing = @repo.timings.find(params[:id])
    @timing.destroy
    render :json => {}, :status => 200
  end

  def index
    send_data @repo.to_srt, :type => "text/plain", :filename => "#{@repo.filename}"
  end

  def get_repository
    @repo = Repository.find params[:repository_id]
  end

end
