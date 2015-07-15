class ApplicationController < ActionController::Base
  protect_from_forgery

  around_filter :add_current_user_to_models


  #before_filter :authenticate_user!
  rescue_from ActiveRecord::RecordNotFound, :with => :render_404

  rescue_from CanCan::AccessDenied do |exception|
    respond_to do |format|
      format.html { redirect_to root_url, notice: exception.message }
      format.json { render json: { error: "You are not authorized to perform this action" }, status: 401 }
    end
  end

  # Redirects to stored location (or to the default).
  def redirect_back_or(default)
    redirect_to(session[:forwarding_url] || default)
    session.delete(:forwarding_url)
  end

  # Stores the URL trying to be accessed.
  def store_location(target_url = nil)
    session[:forwarding_url] = if target_url
                                 target_url
                               elsif request.get?
                                 request.url 
                               end
  end

  def render_404
    respond_to do |format|
      format.html { render :file => "#{Rails.root}/public/404", :layout => false, :status => :not_found }
      format.any  { head :not_found }
    end
  end

  def after_sign_in_path_for(user)
    session[:forwarding_url] || user.url
  end

  def require_logged_in_user
    if current_user
      true
    else
      store_location if request.get?
      redirect_to login_url
    end
  end

  def add_current_user_to_models
    klasses = [ActiveRecord::Base, ActiveRecord::Base.class]
    klasses.each do |k|
      user = current_user

      k.send(:define_method, 'current_user', proc { user } )
    end    
    yield
    klasses.each do |k|
      k.send :remove_method, 'current_user'
    end
  end


end
