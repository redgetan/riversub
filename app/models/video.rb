require 'elasticsearch/model'
require 'active_support/core_ext/hash/conversions'
require 'open-uri'

class Video < ActiveRecord::Base

  has_paper_trail :on => [:update, :destroy]

  include Elasticsearch::Model
  include Elasticsearch::Model::Callbacks

  settings index: { number_of_shards: 1 } do
    mappings dynamic: 'true' do
      indexes :metadata, type: "nested"
    end
  end

  include Rails.application.routes.url_helpers
  include ApplicationHelper

  attr_accessor :current_user
  attr_accessible :artist, :genre, :name, :metadata, :url, :source_url, :language, :current_user

  has_many :repositories
  has_many :users, :through => :repositories

  has_many :releases
  has_many :release_items, :through => :releases

  serialize :metadata, JSON

  before_validation :assign_metadata

  validate :correct_metadata 

  before_create :generate_token

  def self.nested_search(query, options = {})
    self.search({
      query: { 
        nested: { 
          path: 'metadata', 
          query: { 
            bool: { 
              must: [{ 
                multi_match: { 
                  query: query, 
                  type: "phrase", 
                  fields: [
                    'metadata.snippet.title',
                    'metadata.snippet.description',
                    'metadata.snippet.tags',
                    'metadata.nicovideo_thumb_response.thumb.title', 
                    'metadata.nicovideo_thumb_response.thumb.description',
                    'metadata.nicovideo_thumb_response.thumb.tags.tag',
                    'metadata.title',
                    'metadata.description',
                    'metadata.tags',
                    'metadata.naver_response.title',
                    'metadata.naver_response.description'
                  ]  
                } 
              }] 
            } 
          } 
        }
      },
    }.merge(options))
  end

  def correct_metadata
    unless self.metadata && self.source_id
      errors.add(:base, "Url is not a valid youtube link.")
    end
  end

  def assign_metadata(force = false)
    if force || self.metadata.nil?
      if youtube?
        self.metadata = YoutubeClient.new.get_metadata(self.source_id)[0]
        self.yt_channel_id = self.metadata["snippet"]["channelId"]
        self.source_type = "youtube"
      elsif vimeo?
        self.metadata = Vimeo::Simple::Video.info(source_id).parsed_response.first
        self.source_type = "vimeo"
      elsif nicovideo?
        self.metadata = get_nicovideo_metadata(source_id)
        self.source_type = "nicovideo"
      elsif naver?
        self.metadata = get_naver_metadata(source_id)
        self.source_type = "naver"
      end
    end
  end

  def youtube?
    source_url =~ /youtu\.?be/  
  end

  def vimeo?
    source_url =~ /vimeo/
  end

  def nicovideo?
    source_url =~ /nicovideo.jp/
  end

  def naver?
    source_url =~ /tvcast.naver.com/
  end

  def serialize
    {
      :id => self.id,
      :name => self.name,
      :genre => self.genre,
      :url => self.url,
      :source_url => self.source_url,
      :source_type => self.source_type,
      :source_local_url => self.source_local_url,
      :duration => self.duration
    }
  end

  def source_url
    orig_source_url = super  
    orig_source_url =~ /^http:\/\// ? orig_source_url : orig_source_url.prepend("http://")
  end

  def source_local_url
    source_file_path.present? ? source_file_path.gsub(Rails.public_path,"") : ""
  end

  def source_embed_url
    "https://www.youtube.com/embed/#{source_id}"
  end

  def source_description
    return "" unless self.metadata
    
    if youtube?
      self.metadata["snippet"]["description"]  
    elsif vimeo?
      self.metadata["description"]
    elsif nicovideo?
      self.metadata["nicovideo_thumb_response"]["thumb"]["description"]
    elsif naver?
      self.metadata["naver_response"]["description"]
    else 
      ""
    end
  end

  def self.all_language_codes
    self.select("DISTINCT language").map(&:language).compact
  end

  def download_from_source()
   IO.copy_stream(open('http://example.com/image.png'), 'destination.png') 
  end

  def current_language
    language || "en"
  end

  def language_pretty
    ::Language::CODES[current_language]
  end

  def source_id
    if youtube?
      # http://stackoverflow.com/a/9102270
      match = self.source_url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/)
      (match && match[2].length == 11) ? match[2] : nil
    elsif vimeo?
      # http://stackoverflow.com/a/13286930
      match = self.source_url.match(/https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)
      match && match[3] ? match[3] : nil
    elsif nicovideo?
      match = self.source_url.match(/.*nicovideo.jp\/watch\/(.*)/)
      match && match[1] ? match[1] : nil
    elsif naver?
      match = self.source_url.match(/.*tvcast.naver.com\/v\/(\d+)/)
      match && match[1] ? match[1] : nil
    end
  end

  def view_count
    return 0 unless self.metadata
    if youtube?
      self.metadata["statistics"]["viewCount"]  
    elsif vimeo?
      self.metadata["stats_number_of_plays"]
    elsif nicovideo?
      self.metadata["nicovideo_thumb_response"]["thumb"]["view_counter"]
    elsif naver?
      self.metadata["naver_response"]["view_counter"]
    else 
      0
    end
  end

  def definition 
    return "" unless self.metadata

    if youtube?
      self.metadata["contentDetails"]["definition"]
    else
      ""
    end
  end

  def duration
    return 0 unless self.metadata

    if youtube?
      ytformat = self.metadata["contentDetails"]["duration"] # youtube video duration
      yt_duration_to_seconds(ytformat)
    elsif vimeo?
      self.metadata["duration"]
    elsif nicovideo?
      nico_duration_to_seconds(self.metadata["nicovideo_thumb_response"]["thumb"]["length"])
    elsif naver?
      self.metadata["naver_response"]["duration"]
    else
      0
    end
  end

  def uploader_username
    return "unavailable" unless self.metadata

    if youtube?
      self.metadata["snippet"]["channelTitle"]
    elsif vimeo?
      self.metadata["user_name"]
    elsif nicovideo?
      self.metadata["nicovideo_thumb_response"]["thumb"]["user_nickname"]
    elsif naver?
      self.metadata["naver_response"]["user_name"]
    else 
      "unavailable"
    end
  end

  def uploader_url
    return "unavailable" unless self.metadata

    if youtube?
      "https://www.youtube.com/channel/#{self.metadata["snippet"]["channelId"]}"
    elsif vimeo?
      self.metadata["user_url"]
    elsif nicovideo?
      "http://www.nicovideo.jp/user/#{self.metadata["nicovideo_thumb_response"]["thumb"]["user_id"]}"
    elsif naver?
      self.metadata["naver_response"]["user_url"]
    else 
      "unavailable"
    end
  end

  def name
    return "Video unavailable" unless self.metadata

    if youtube?
      self.metadata["snippet"]["title"]  
    elsif vimeo?
      self.metadata["title"]
    elsif nicovideo?
      self.metadata["nicovideo_thumb_response"]["thumb"]["title"]
    elsif naver?
      self.metadata["naver_response"]["title"]
    else 
      "Video unavailable"
    end
  end

  def thumbnail_url
    return "" unless self.metadata

    if youtube?
      self.metadata["snippet"]["thumbnails"]["default"]["url"]
    elsif vimeo?
      self.metadata["thumbnail_medium"]
    elsif nicovideo?
      self.metadata["nicovideo_thumb_response"]["thumb"]["thumbnail_url"]
    elsif naver?
      self.metadata["naver_response"]["thumbnail_url"]
    else 
      ""
    end
  end

  def thumbnail_url_hq
    return "" unless self.metadata

    if youtube?
      self.metadata["snippet"]["thumbnails"]["high"]["url"]
    elsif vimeo?
      self.metadata["thumbnail_large"]
    elsif nicovideo?
      self.metadata["nicovideo_thumb_response"]["thumb"]["thumbnail_url"] 
    elsif naver?
      self.metadata["naver_response"]["thumbnail_url"]
    else 
      ""
    end
  end

  def generate_token
    self.token = loop do
      random_token = SecureRandom.urlsafe_base64(8)
      break random_token unless self.class.where(token: random_token).exists?
    end
  end

  def empty_repository?(target_user)
    !repositories.select { |repo| repo.visible_to_user?(target_user) }.present?
  end

  def repositories_visible_to_user(target_user, show_published_only = true)
    repositories.select { |repo| repo.visible_to_user?(target_user, show_published_only) }
  end

  def ask_source_language?
    self.language.blank?  
  end

  def title
    name
  end

  def url
    video_url(self)
  end

  def new_repository_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params) 
  end

  def new_empty_repository_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params.merge(empty: true)) 
  end

  def new_repository_via_upload_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params.merge(upload: true)) 
  end

  def translate_repository_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    video_repository_new_url(self, extra_params) 
  end

  def published_repositories
    self.repositories.published
  end

  def self.language_select_options
    Language::CODES.map{|k,v| [v,k]}.unshift(["Unknown",""])
  end

  def self.selected_language_select_for(group)
    group.settings.get("default_video_language_code")
  end

  def self.for_channel_id(channel_ids)
    self.where(yt_channel_id: channel_ids)
  end

  def get_nicovideo_metadata(source_id)
    getthumbinfo_url = "http://ext.nicovideo.jp/api/getthumbinfo/#{source_id}"
    Hash.from_xml(RestClient.get(getthumbinfo_url))
  end

  def get_naver_metadata(source_id)
    url = "http://tvcast.naver.com/v/#{source_id}"
    doc = Nokogiri::HTML(open(url))

    {
      :naver_response => {
        :title => doc.css("meta[property='og:title']").first.attributes["content"].value,
        :description => doc.css("meta[property='og:description']").first.attributes["content"].value,
        :thumbnail_url => doc.css("meta[property='og:image']").first.attributes["content"].value,
        :user_url => doc.css(".ch_tit a").first.attributes["href"].value,
        :user_name => doc.css(".ch_tit a img").first.attributes["alt"].value,
        :view_counter => doc.css(".watch_title .title_info .play").first.text.match(/\d+/).to_s.to_i,
        :duration => doc.text.match(/playtime=(\d+)/)[1].to_i
      }
    }
  end

  def ready?
    if source_type == "naver" || source_type == "nicovideo"
      !new_record? && source_file_path.present?
    else
      !new_record?
    end
  end

  def start_download(source_download_url, cookie = {})
    self.update_column(:download_in_progress, true)
    self.update_column(:download_failed, false)
    Delayed::Job.enqueue Video::DownloadSourceJob.new(self, source_download_url, cookie)
  end

  def to_param
    self.token
  end

  class DownloadSourceJob 

    def initialize(video, source_download_url, cookie = {})
      @video = video
      @source_download_url = source_download_url
      @cookie = cookie
    end

    def perform
      require 'open-uri'
      require 'fileutils'
      FileUtils.mkdir_p File.dirname(file_destination_path)

      perform_download if @video.source_type == "naver" || @video.source_type == "nicovideo"
    end

    def perform_download
      content_length = 0;
      size_downloaded = 0;
      last_progress = 0;
      last_update_time = Time.now;

      file = open(@source_download_url, {
        "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36",
        "Cookie" => @cookie,
        :content_length_proc => lambda { |total_size| content_length = total_size },
        :progress_proc => lambda { |size|
          size_downloaded += size
          progress = (size / content_length.to_f * 100).round

          if (progress != last_progress) && (Time.now - last_update_time) > 0.5
            @video.update_column(:download_progress, progress)
            last_update_time = Time.now
          end

          last_progress = progress
        }
      })

      IO.copy_stream(file,file_destination_path)

      @video.update_column(:source_file_path, file_destination_path)
    end

    def file_destination_path
      [Rails.public_path, "downloads", "videos", "#{@video.id}.mp4"].join("/")
    end

    def success(job)
      @video.update_column(:download_in_progress, false)
      @video.update_column(:download_failed, false)
    end

    def error(job, exception)
      @video.update_column(:download_in_progress, false)
      @video.update_column(:download_failed, true)
    end

    def failure(job)
      @video.update_column(:download_in_progress, false)
      @video.update_column(:download_failed, true)
    end

  end

end
