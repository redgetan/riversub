River::Application.routes.draw do

  resources :groups


  # http://stackoverflow.com/questions/3993651/rails-3-ssl-routing-redirects-from-https-to-http
  protocol = Rails.env.development? ? "http://" : "https://"

  scope :protocol => protocol, :constraints => { :protocol => protocol } do
    devise_for :users, :controllers => { 
      :registrations => "registrations", 
      :omniauth_callbacks => "users/omniauth_callbacks" 
    }
  end


  scope :protocol => protocol, :constraints => { :protocol => protocol } do
    devise_scope :user do
      put "/users/change_avatar",  :to => "registrations#change_avatar", :as => "user_change_avatar"
      get "/users/:username",      :to => "users#show",                  :as => "user"
    end

  end

  get "faq", :to => "home#faq"
  get "how_to_use", :to => "home#how_to_use"

  get "videos",                                :to => "videos#index"
  get "videos/unpublished",                    :to => "videos#unpublished"
  post "videos/sub",                           :to => "videos#sub",    :as => "sub_videos"

  resources "repositories", :only => [] do
    resources "timings", :only => [:index, :create, :update, :destroy]
  end

  get "/:token",                        to: "videos#show",   as: "video"
  get "/:token/setup",                  to: "videos#setup",  as: "editor_video_setup"
  post "/:token/finish_setup",          to: "videos#finish_setup",  as: "editor_video_finish_setup"
  post "/:token/publish",               to: "videos#publish", as: "publish_videos"
  get "/:token/editor",                 to: "videos#editor", as: "editor_video"
  get '/:username/:token',              to: 'videos#show',   as: 'user_video'
  get '/:username/:token/editor',       to: 'videos#editor', as: 'editor_user_video'

  root :to => "home#index"


  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => 'welcome#index'

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id))(.:format)'
end
