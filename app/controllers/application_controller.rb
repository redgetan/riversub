class ApplicationController < ActionController::Base

  # force_ssl unless: lambda { |x|
  #   Rails.env.development? || 
  #     (params[:controller] == "repositories" && params[:action] ==  "show") || 
  #     (params[:controller] == "repositories" && params[:action] ==  "editor")
  # }

  protect_from_forgery

  around_filter :add_current_user_to_models
  around_filter :add_http_protocol_to_models
  before_filter :clear_forwarding_url


  #before_filter :authenticate_user!
  rescue_from ActiveRecord::RecordNotFound do |exception|
    flash[:error] = "Sorry, that page doesnt exist"
    redirect_to root_url
  end

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

  # i visit a first page that requires login. i decided to visit another page
  # then i decide to login. i should not be redirected to first page.
  def clear_forwarding_url
    return if params[:controller] == "sessions" 
    
    session[:forwarding_url] = nil
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

  def add_http_protocol_to_models
    klasses = [ActiveRecord::Base, ActiveRecord::Base.class]
    klasses.each do |k|
      protocol = request.protocol

      k.send(:define_method, 'http_protocol', proc { protocol } )
    end    
    yield
    klasses.each do |k|
      k.send :remove_method, 'http_protocol'
    end
  end

  def track_ahoy_visit
    # don't track it automatically. only track ones called by ahoy.track_visit manually
  end


end
