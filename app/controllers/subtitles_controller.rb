class SubtitlesController < ApplicationController
  def create
    @video = Video.find params[:video_id]

    @subtitles = []
    params[:transcript].gsub("\r","").split("\n").each_with_index do |item,i|
      next if item.blank?
      @subtitle = @video.subtitles.create({ :text => item, :order => i})
      unless @subtitle
        render :json => {
          :error => @subtitle.errors.messages,
          :created => @subtitles.map(&:serialize).to_json
        }, :status => 403 and return
      end
      @subtitles << @subtitle
    end

    render :json => @subtitles.map(&:serialize).to_json, :status => 200

  end

  def update

  end

  def destroy
    @video = Video.find params[:video_id]
    params[:subtitles].each do |id|
      @subtitle = @video.subtitles.find(id)
      @subtitle.delete
    end
    render :json => {}, :status => 200
  end
end
