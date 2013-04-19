class SongsController < ApplicationController

  def new
    @song = Song.new

    render :layout => false
  end

  def create
    @song = Song.new params[:song]

    @song.subtitles_attributes = @song.lyrics.gsub("\r","").split("\n").each_with_index.inject([]) do |result,(item,i)|
      result << { :text => item, :order => i} unless item.blank? 
      result
    end

    if @song.save
      render :json => { :song_id => @song.id }, :status => 200
    else
      render :json => { :error => @song.errors.messages }, :status => 403
    end

  end

  def show
    @song = Song.find params[:id]

    render :json => @song.serialize.to_json
  end

  def edit
    @song = Song.find params[:id]
    @media_sources = MediaSource.highest_voted(@song.id)
    respond_to :html
  end
end
