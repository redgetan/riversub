class TimingsController < ApplicationController
  def create
    # needs subtitle 
    # needs song_id, start,end, subtitle_id 
    @song = Song.find params[:song_id]
    @timing = @song.build_timings(
      :start_time => params[:start_time],
      :end_time => params[:end_time]
    )

    if @timing.save
      render :json => @timing, :status => 200
    else
      render :json => { :error => @timing.errors.messages }, :status => 403
    end
  end

  def update
    @song = Song.find params[:song_id]
    @timing = @song.timing

    success = @timing.update_attributes(
      :start_time => params[:start_time],
      :end_time => params[:end_time]
    )

    if success
      render :json => @timing, :status => 200
    else
      render :json => { :error => @timing.errors.messages }, :status => 403
    end
  end
end
