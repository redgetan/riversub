class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.find_by_username(params[:username])

    @repositories = if user_signed_in? && current_user == @user
                      @user.repositories # all
                    else
                      @user.repositories.published # if not logged in, show only published ones
                    end


    if @access_token = session['access_token']
      # @user_public_uploads = get_user_public_uploads
    end
  end

  def get_user_public_uploads
    require 'google/api_client'
    client = Google::APIClient.new(:application_name => "riversub",:application_version => "0.0.1")
    client.authorization.access_token = @access_token
    youtube = client.discovered_api("youtube","v3")
    channels_response = client.execute!(:api_method => youtube.channels.list,:parameters => {:mine => true,:part => 'contentDetails'})
    uploads_list_id = channels_response.data.items.first['contentDetails']['relatedPlaylists']['uploads']

    public_uploads = []
    next_page_token = ''
    until next_page_token.nil?
      playlistitems_response = client.execute!(
        :api_method => youtube.playlist_items.list,
        :parameters => {
          :playlistId => uploads_list_id,
          :part => 'snippet,status',
          :maxResults => 50,
          :pageToken => next_page_token
        }
      )

      # Print information about each video.
      playlistitems_response.data.items.each do |playlist_item|
        public_uploads << playlist_item if playlist_item["status"]["privacyStatus"] == "public"
      end

      next_page_token = playlistitems_response.next_page_token
    end

    return public_uploads
  rescue Google::APIClient::TransmissionError => e
    flash[:error] = e.result.body
    return []
  end

end
