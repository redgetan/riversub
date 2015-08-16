class PagesController < ApplicationController

  def index
    page_list = Page.all.map(&:url).join("\n")
    render :text => "<pre>#{page_list}</pre>"  
  end

  def create
    @page = Page.new(params[:page])

    unless @page.save
      flash[:error] = @page.errors.full_messages.join(".")
      @user = current_user
      render "users/show" and return
    end

   redirect_to current_user.url
  end

  def show
    @page = Page.find_by_short_name! params[:id]  
    @user_submissions = @page.published_repositories.includes(:video, { :timings => :subtitle }, :user).recent

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @page }
    end
  end

  def producer_uploads
    @page = Page.find_by_short_name! params[:page_id]  

    producer_public_videos = @page.producer_public_videos(params[:page_token])

    render partial: "pages/producer_uploads", locals: { page: @page, producer_public_videos: producer_public_videos.items, next_page_token: producer_public_videos.next_page_token}
  end

  def update_name
    @page = Page.find_by_short_name params[:id]  

    unless can? :edit, @page
      flash[:error] = "You don't have permission to do that"
      redirect_to root_url and return
    end


    unless @page.update_attributes(short_name: params[:page_name])
      flash[:error] = @page.errors.full_messages.join(".")
      @user = current_user
      render "users/show" and return
    end

    redirect_to current_user.url
  end
end