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

  def fix
    if !(subtitle = find_subtitle)
      return render :text => "can't find subtitle", :status => 400
    end

    if correction_request = subtitle.correction_request(params[:text])
      render :json => {}, :status => 200
    else
      render :json => { error: correction_request.errors.full_messages, :status => 400 }
    end
  end

  def destroy
    @video = Video.find params[:video_id]
    params[:subtitles].each do |id|
      @subtitle = @video.subtitles.find(id)
      @subtitle.delete
    end
    render :json => {}, :status => 200
  end

  def unvote
    if !(subtitle = find_subtitle)
      return render :text => "can't find subtitle", :status => 400
    end

    subtitle.unvote_by current_user

    render :text => "ok"
  end

  def upvote
    if !(subtitle = find_subtitle)
      return render :text => "can't find subtitle", :status => 400
    end

    unless current_user
      store_location(subtitle.url)
      render :text => new_user_session_url, :status => 401 and return
    end

    subtitle.liked_by current_user

    render :text => "ok"
  end

  def downvote
    if !(subtitle = find_subtitle)
      return render :text => "can't find subtitle", :status => 400
    end

    unless current_user
      store_location(subtitle.url)
      render :text => new_user_session_url, :status => 401 and return
    end

    if !current_user.can_downvote?(subtitle)
      return render :text => "not permitted to downvote", :status => 400
    end

    subtitle.disliked_by current_user

    render :text => "ok"
  end

  private

    def find_subtitle
      Subtitle.where(:token => params[:id]).first
    end

end
