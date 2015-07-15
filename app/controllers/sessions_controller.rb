class SessionsController < Devise::SessionsController
  def new
    store_location(params[:location]) if params[:location]
    super  
  end

end