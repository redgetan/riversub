class VideosController < ApplicationController

  def sub
    metadata = params[:video_metadata]

    # if video already exist not need to create another one
    @video = Video.where(:url => params[:media_url])
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })
    @repo = if current_user
              Repository.where(:user_id => current_user.id, 
                               :video_id => @video.id)
                        .first_or_create!
            else
              Repository.create!(:video_id => @video.id)
            end

    render :json => { :redirect_url => @repo.editor_url } 
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end

  def publish
    @repo = Repository.find_by_token! params[:token]

    if @repo.update_attributes!(is_published: true)
      render :json => {}, :status => 200
    else
      render :json => { :error => @repo.errors.full_messages }, :status => 403
    end
  end

  def editor
    @repo = Repository.find_by_token! params[:token]

    if @repo.user && @repo.user != current_user 
      render :text => "you do not have permission to edit the subtitles", :status => 403 and return
    end

    respond_to :html
  end


  def show
    @repo = Repository.find_by_token! params[:token]

    if @repo.is_published
      respond_to :html
    else
      render :text => "Video is not published" , :status => 404
    end
  end

  def index
    @repos = Repository.published.recent.page params[:page]
  end

end
