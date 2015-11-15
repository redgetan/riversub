River::Application.routes.draw do

  # http://stackoverflow.com/questions/3993651/rails-3-ssl-routing-redirects-from-https-to-http
  protocol = Rails.env.development? ? "http://" : "https://"

  if Rails.env.development?
    match "/delayed_job" => DelayedJobWeb, :anchor => false, via: [:get, :post]
  end

  scope :protocol => protocol, :constraints => { :protocol => protocol } do
    devise_for :users, :controllers => { 
      :registrations => "registrations", 
      :sessions => "sessions", 
      :omniauth_callbacks => "users/omniauth_callbacks" 
    }

    devise_scope :user do
      get "/users/auth/google_oauth2_reconnect/callback", :to => "users/omniauth_callbacks#google_oauth2_reconnect", :as => "google_omniauth_reconnect_callback"
      put "/users/change_avatar",  :to => "registrations#change_avatar", :as => "user_change_avatar"
      get "/users/fansubber",      :to => "registrations#fansubber",     :as => "user_fansubber"
      get "/users/:username",      :to => "users#show",                  :as => "user"
      get "/users/:username/repositories", :to => "repositories#index",  :as => "user_repositories"
      get  "/users/:username/comments/:comment_short_id", to: "users#show", as: "user_wall"
    end

    get "features", :to => "home#features"
    get "faq", :to => "home#faq"
    get "how_to_use", :to => "home#how_to_use"
    get "how_it_works", :to => "home#how_it_works"
    get "explore",   to: "home#community_translations",   as: "community_translations"
    get "explore_general",   to: "home#unclassified_translations",   as: "unclassified_community_translations"
    get "search",   to: "home#search",   as: "search"

    get "videos/ready_state",                    :to => "videos#ready_state",     :as => "ready_state"
    get "videos/new",                            :to => "videos#new"
    get "videos/:token",                        to: "videos#show",            as: "video"
    get "videos/:token/query_progress",        :to => "videos#query_progress",     :as => "query_progress"
    post "videos/sub",                           :to => "videos#sub",          :as => "sub_videos"
    post "videos/prepare",                        :to => "videos#prepare",     :as => "prepare_videos"
    get  "videos/:video_token/repositories/new", :to => "repositories#new",    :as => "video_repository_new"
    post "videos/:video_token/repositories",     :to => "repositories#create", :as => "video_repository_create"
    get  "requests",         :to => "requests#index",        :as => "video_request_index"
    get  "requests/new",     :to => "requests#new",        :as => "video_request_new"
    post "requests",         :to => "requests#create",     :as => "video_request_create"
    get "requests/:id",      :to => "requests#show",       :as => "video_request_show"
    get "subs",                                  :to => "repositories#index",  :as => "repositories"
    get "releases/:id",                          :to => "releases#show",  :as => "release_show"

    resources :pages, :only => [:index, :new, :create, :show, :update], :path => "p" do 
      get "producer_uploads"
      get "status"
    end

    match "/groups/:name" => redirect("/topics/%{name}")

    resources :groups, :path => "topics" do
      member do 
        post "join"
        post "add_moderator"
        put  "change_avatar"
        get  "comments/:comment_short_id", to: "groups#show", as: "comment"
      end

      resources :requests, :only => [:new, :create, :show] 

      resources :releases do 
        collection do 
          get "mailchimp"
        end
        member do
          post "publish"
        end
      end
    end

    resources :releases do 
      resources :release_items, :only => [:create, :show, :update, :destroy]
    end

    resources :correction_requests, :only => [:index], :controller => "correction_requests" do
      member do
        post "approve"
        post "reject"
      end
    end

    resources :subtitles, :only => [] do
      member do
        post "fix"
        post "upvote"
        post "downvote"
        post "unvote"
      end
    end

    resources :comments do
      member do
        get "reply"
        post "upvote"
        post "downvote"
        post "unvote"

        post "delete"
        post "undelete"
      end
    end


    post "/r/:token/delete",                to: "repositories#destroy",   as: "repo_destroy"

    post "/r/:token/fork",                  to: "repositories#fork",   as: "fork_repo"


    root :to => "home#index"

  end

  # NON HTTPS - to allow external scripts that's non https (i.e. niconico douga)
  resources "repositories", :only => [] do
    resources "timings", :only => [:index, :create, :update, :destroy]

    collection do
      get "current_user_repositories"
      get "unpublished"
      get "anonymous"
    end

    member do
      post "upvote"
      post "downvote"
      post "unvote"
    end
  end

  get "/r/:token/download",               to: "timings#index",   as: "repo_subtitle_download"
  get "/:token",                        to: "repositories#show",   as: "repo"
  get "/r/:token",                        to: "repositories#show",   as: "repo"
  get "/r/:token/serialize",              to: "repositories#serialize",   as: "repo_serialize"
  get "/r/:token/naver_embed_html",       to: "repositories#naver_embed_html",   as: "repo_naver_embed_html"
  get "/r/:token/comments/:comment_short_id", to: "repositories#show", as: "repo_comment"
  get "/r/:token/subtitles/:subtitle_short_id", to: "repositories#show", as: "repo_subtitle"
  get "/embed/:token",                    to: "repositories#embed",   as: "repo_embed"
  get "/r/:token/editor",                 to: "repositories#editor", as: "editor_repo"
  get '/:username/:token',              to: 'repositories#show',   as: 'user_repo'
  get '/:username/:token/editor',       to: 'repositories#editor', as: 'editor_user_repo'
  post "/r/:token/publish",               to: "repositories#publish", as: "publish_repo"
  post "/r/:token/update_title",          to: "repositories#update_title", as: "update_repo_title"
  post "/r/:token/update_font",          to: "repositories#update_font", as: "update_repo_font"
  post "/r/:token/update_language",       to: "repositories#update_language", as: "update_repo_language"
  post "/r/:token/update_subtitle_position",       to: "repositories#update_subtitle_position", as: "update_repo_subtitle_position"

  post "videos/:video_token/repositories/upload", :to => "repositories#upload", :as => "video_repository_upload"
  post "/r/:token/upload", :to => "repositories#upload_to_existing_repo", :as => "upload_to_existing_repo"
  post "/r/:token/export_to_youtube", :to => "repositories#export_to_youtube", :as => "export_to_youtube_repo"


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
