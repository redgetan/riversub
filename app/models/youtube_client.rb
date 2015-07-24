class YoutubeClient
  attr_accessor :client

  def initialize(access_token, refresh_token, expires_at)
    @client = Google::APIClient.new(:application_name => "riversub",
                                    :application_version => "0.0.1",
                                    :auto_refresh_token => false) # we want to refresh it ourselves 
                                                                  # so we can save new tokens to DB
    @client.authorization.client_id = GOOGLE_CLIENT_ID
    @client.authorization.client_secret = GOOGLE_CLIENT_SECRET

    @client.authorization.access_token  = access_token
    @client.authorization.refresh_token = refresh_token
    @client.authorization.expires_at    = expires_at
  end

  def expired?
    @client.authorization.expired?
  end

  def refresh!
    @client.authorization.refresh!
  end

  def producer_public_videos
    
    youtube = @client.discovered_api("youtube","v3")
    channels_response = @client.execute!(:api_method => youtube.channels.list,:parameters => {:mine => true,:part => 'contentDetails'})
    uploads_list_id = channels_response.data.items.first['contentDetails']['relatedPlaylists']['uploads']

    public_uploads = []
    next_page_token = ''
    until next_page_token.nil?
      playlistitems_response = @client.execute!(
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
    return []
  end
end
