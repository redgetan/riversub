class ApplicationController < ActionController::Base
  protect_from_forgery

  #before_filter :authenticate_user!
  rescue_from ActiveRecord::RecordNotFound, :with => :render_404

  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_url, :alert => exception.message
  end

  def store_previous_url
    session[:previous_url] = request.referer
  end

  def render_404
    respond_to do |format|
      format.html { render :file => "#{Rails.root}/public/404", :layout => false, :status => :not_found }
      format.any  { head :not_found }
    end
  end

  def after_sign_in_path_for(user)
    user_action = if query = URI.parse(request.referer).query 
                    CGI.parse(query)["user_action"][0]
                  else
                    nil
                  end

    case user_action
    when "upvote_a_comment","upvote_a_subtitle","add_a_language","upload_a_subtitle_file"
      session[:previous_url]
    when "subtitle_a_video"
      videos_new_url
    else
      user_url(user)
    end
  end

end
