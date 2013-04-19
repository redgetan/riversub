class SubtitlesController < ApplicationController
  def create

    @subtitle = Subtitle.new params[:subtitle]

    if @subtitle.save
      render :json => { :song_id => @subtitle.id }, :status => 200
    else
      render :json => { :error => @subtitle.errors.messages }, :status => 403
    end
  end

  def update
    
  end
end
