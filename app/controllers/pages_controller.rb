class PagesController < ApplicationController

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

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @page }
    end
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