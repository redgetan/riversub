class YoutubeClient
  include ApplicationHelper

  attr_accessor :client

  def initialize(options = {})
    @client = Google::APIClient.new(:application_name => "riversub",
                                    :application_version => "0.0.1",
                                    :auto_refresh_token => false) # we want to refresh it ourselves 
                                                                  # so we can save new tokens to DB
    @client.authorization.client_id = GOOGLE_CLIENT_ID
    @client.authorization.client_secret = GOOGLE_CLIENT_SECRET

    @client.authorization.access_token  = options[:access_token]  if options[:access_token]
    @client.authorization.refresh_token = options[:refresh_token] if options[:refresh_token]
    @client.authorization.expires_at    = options[:expires_at]    if options[:expires_at]
  end

  def expired?
    @client.authorization.expired?
  end

  def refresh!
    @client.authorization.refresh!
  end

  # list of videos with these metadata
  #   - thumbnail, title, duration, list of captions
  # return
  #   array of hashes

  def producer_public_videos

    @producer_public_videos ||= begin
      result = []

      playlist_items = get_public_uploads    
      video_ids = playlist_items.map { |item| item["snippet"]["resourceId"]["videoId"] }

      metadata_list = get_metadata(video_ids)
      duration_hash = metadata_list.map do |metadata|
        { metadata["id"] => metadata["contentDetails"]["duration"] }
      end.reduce(&:merge)

      view_hash = metadata_list.map do |metadata|
        { metadata["id"] => metadata["statistics"]["viewCount"] }
      end.reduce(&:merge)

      playlist_items.map do |playlist_item|
        video_id = playlist_item["snippet"]["resourceId"]["videoId"]

        {
          :id => video_id,
          :thumbnail_url => playlist_item["snippet"]["thumbnails"]["default"]["url"],
          :source_url => "https://youtube.com/watch?v=#{video_id}",
          :title => playlist_item["snippet"]["title"],
          :duration => yt_duration_to_seconds(duration_hash[video_id]),
          :views => view_hash[video_id],
          :published_at => playlist_item["snippet"]["publishedAt"]
        }
      end
    end
  end

  def get_channel_data
    @channel_data ||= begin
      channels_response = @client.execute!(
        :api_method => youtube.channels.list,
        :parameters => {:mine => true,:part => 'snippet,contentDetails'}
      )
    end
  end

  def youtube
    @client.discovered_api("youtube","v3")
  end

  def get_public_uploads
    channels_response = get_channel_data
    uploads_list_id = channels_response.data.items.first['contentDetails']['relatedPlaylists']['uploads']

    public_uploads = []
    next_page_token = ''
    until next_page_token.nil?
      playlistitems_response = @client.execute!(
        :api_method => youtube.playlist_items.list,
        :parameters => {
          :playlistId => uploads_list_id,
          :part => 'snippet,status,contentDetails',
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

  def get_caption_list(video_id, part="snippet")
    captions_list = @client.execute!({
      :api_method => youtube.captions.list, 
      :parameters => {:part => 'snippet', :videoId => video_id }
    })
  end

  def upload_caption(video_id, options={})
    url = "https://gdata.youtube.com/feeds/api/videos/#{video_id}/captions" 
    RestClient.post(url, options[:body], 
      :content_type => "application/vnd.youtube.timedtext; charset=UTF-8", 
      :content_language => options[:language_code], 
      "Authorization" => "Bearer #{@client.authorization.access_token}", 
      "X-GData-Key" => "key=#{X_GDATA_KEY}", 
      "Slug" => options[:title])
  end

  def get_metadata(video_ids, part = "snippet,contentDetails,statistics")
    url = "https://www.googleapis.com/youtube/v3/videos?part=#{part}&id=#{Array(video_ids).join(",")}&key=#{GOOGLE_API_KEY}"
    response = RestClient::Request.execute(method: :get, url: url, verify_ssl: false)
    JSON.parse(response)["items"]
  end
end
