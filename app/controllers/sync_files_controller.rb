class SyncFilesController < ApplicationController
  def create
    @song = Song.find params[:song_id]
    @sync_file = @song.sync_files.build(:timecode => params[:timecode])

    if @sync_file.save
      render :json => {}, :status => 200
    else
      render :json => { :error => @sync_file.errors.messages }, :status => 403
    end
  end

  def update
    @song = Song.find params[:song_id]
    @sync_file = @song.sync_files.find(params[:id])


    if @sync_file.update_attributes(:timecode => params[:timecode])
      render :json => @sync_file, :status => 200
    else
      render :json => { :error => @sync_file.errors.messages }, :status => 403
    end
  end
end
