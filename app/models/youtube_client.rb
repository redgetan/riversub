class YoutubeClient
  include ApplicationHelper

  class InsufficientPermissions < StandardError; end
  class ExportCaptionError < StandardError; end

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

  def producer_public_videos(page_token = '')

    @producer_public_videos ||= begin
      result = []

      channels_response = get_channel_data
      uploads_list_id = channels_response.data.items.first['contentDetails']['relatedPlaylists']['uploads']

      public_uploads = get_public_uploads(uploads_list_id, page_token)    
      playlist_items = public_uploads.items
      video_ids = playlist_items.map { |item| item["snippet"]["resourceId"]["videoId"] }

      metadata_list = get_metadata(video_ids)
      duration_hash = metadata_list.map do |metadata|
        { metadata["id"] => metadata["contentDetails"]["duration"] }
      end.reduce(&:merge)

      view_hash = metadata_list.map do |metadata|
        { metadata["id"] => metadata["statistics"]["viewCount"] }
      end.reduce(&:merge)

      { 
        :next_page_token => public_uploads.next_page_token, 
        :items => serialize_playlist_items(playlist_items, duration_hash, view_hash)
      }
    end
  end

  def serialize_playlist_items(playlist_items, duration_hash, view_hash)
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

  def get_public_uploads(uploads_list_id, page_token = '')
    public_uploads = []

    playlistitems_response = @client.execute!(
      :api_method => youtube.playlist_items.list,
      :parameters => {
        :playlistId => uploads_list_id,
        :part => 'snippet,status,contentDetails',
        :maxResults => 50,
        :pageToken => page_token
      }
    )

    # Print information about each video.
    playlistitems_response.data.items.each do |playlist_item|
      public_uploads << playlist_item if playlist_item["status"]["privacyStatus"] == "public"
    end

    next_page_token = playlistitems_response.next_page_token

    return {
      next_page_token: next_page_token,
      items: public_uploads
    }
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
    # content type may need to be 'application/vnd.youtube.timedtext; charset=UTF-8'
    media = Google::APIClient::UploadIO.new(StringIO.new(options[:body]), 'application/x-subrip')
    metadata = {
      snippet: {
        isDraft: false,
        name: options[:title],
        language: options[:language_code],
        videoId: video_id
      }
    }

    result = @client.execute({
      :api_method => youtube.captions.insert,
      :parameters => { 'part' => 'snippet', 'uploadType' => 'multipart', },
      :body_object => metadata,
      :media => media
    })

    if result.status == 403 && result.body =~ /Insufficient Permission/i
      scopes_matcher = /scope=\"(.*)\"/
      result.response.env.response_headers["www-authenticate"] =~ scopes_matcher
      insufficient_scope = $1
      raise InsufficientPermissions.new(insufficient_scope)
    end

    if result.status != 200
      error_message = JSON.parse(result.body)["error"]["message"]
      raise ExportCaptionError.new(error_message)
    end
  end

  def get_access_token_status
    RestClient.get("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=#{@client.authorization.access_token}")  
  end

  def get_metadata(video_ids, part = "snippet,contentDetails,statistics")
    tries ||= 3

    google_api_key = File.exists?("/home/hatch/.google_api_key") ? File.read("/home/hatch/.google_api_key") : ENV["GOOGLE_API_KEY"]
    url = "https://www.googleapis.com/youtube/v3/videos?part=#{part}&id=#{Array(video_ids).join(",")}&key=#{google_api_key}"
    STDOUT.puts "KURORO: #{url}"

    response = RestClient::Request.execute(method: :get, url: url, verify_ssl: false)
    JSON.parse(response)["items"]
  rescue RestClient::Forbidden
    retry unless (tries -= 1).zero?
  end
end
