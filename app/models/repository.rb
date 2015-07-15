# encoding: UTF-8

require_dependency "vote"
require_dependency "public_activity"

class Repository < ActiveRecord::Base

  has_paper_trail

  include Rails.application.routes.url_helpers
  include ApplicationHelper
  include ActionView::Helpers::NumberHelper
  include ActionView::Helpers::TextHelper

  paginates_per 20

  acts_as_votable
  acts_as_commentable
  acts_as_ordered_taggable

  belongs_to :video
  belongs_to :user

  has_many :subtitles
  has_many :timings
  has_many :comments, :foreign_key => "commentable_id"
  has_many :votes, :as => :votable, :class_name => "ActsAsVotable::Vote"

  belongs_to :group
  belongs_to :release_item
  belongs_to :request

  attr_accessor :current_user, :highlight_subtitle_short_id, :is_embed, :is_fullscreen

  attr_accessible :video_id, :user_id, :video, :user, :token,
                  :is_published, :language, :parent_repository_id, :title,
                  :group_id, :release_item_id, :current_user,
                  :highlight_subtitle_short_id, :request_id, :group

  validates :video_id, :presence => true
  validates :token, :uniqueness => true, on: :create

  before_validation :generate_token
  # before_save :auto_publish_anonymous_repo


  # scope :with_timings_count, select("repositories.*, COUNT(timings.id) timings_count")
  #                              .joins("LEFT JOIN timings on repositories.id = timings.repository_id")
  #                              .group("repositories.id")

  scope :anonymously_subtitled, where("user_id IS NULL")
  scope :user_subtitled,        where("user_id IS NOT NULL")
  scope :published,             where("is_published is true")
  scope :unpublished,           where("is_published is NULL")
  scope :imported,              where("is_youtube_imported is true")
  scope :unimported,            where("is_youtube_imported is false")
  scope :recent,                order("updated_at DESC")

  scope :for_country, lambda { |country_code|
    language_code = Language.country_code_to_language_code(country_code)
    joins(:video).where("videos.language = ?", language_code)
  }

  GUIDED_WALKTHROUGH_YOUTUBE_URL = "http://www.youtube.com/watch?v=6tNTcZOpZ7c"
  ANONYMOUS_USERNAME = "default"

  def self.related(repo)
    if repo.group.try(:short_name) == "jpweekly"
      self.where(group_id: repo.group_id).where(language: "en").shuffle.take(10)
    else
      self.where(group_id: repo.group_id).shuffle.take(10)
    end
  end

  def self.recent_user_subtitled_published_ids(num_of_entries = 10)
    Repository.select("max(id) AS repo_id")
              .published
              .user_subtitled
              .recent
              .group("user_id")
              .limit(num_of_entries)
              .map(&:repo_id)
  end

  def self.top_grouped_by_source_language(num_of_entries = 6)
    languages = Video.all_language_codes
    repo_with_video = self.published.joins(:video)

    languages.inject({}) do |result, language|
      repos = repo_with_video.where("videos.language = ?", language)
                             .order("repositories.updated_at DESC")
                             .limit(num_of_entries)

      result.merge({ language => repos })
    end
  end

  def self.most_commented(num_of_entries = 6)        
    Repository.select("COUNT(repositories.id) AS comment_count, repositories.*")
              .joins(:comments)
              .published
              .group("repositories.id")
              .order("comment_count DESC")
              .limit(num_of_entries)
  end

  def self.repository_counts_by_language
    self.select("videos.language, COUNT(*) as repo_count")
        .joins(:video)
        .published
        .group("videos.language")
        .to_a
        .inject({}) do |result, record|
      result.merge({ record.language => record.repo_count })
    end
  end

  def self.community_translations
    self.where("group_id IS NULL")  
        .joins(:video)
        .published
        .where("videos.language = 'ja'")
        .order("repositories.created_at DESC")
  end

  def self.repository_counts_by_country
    repository_counts_by_language.inject({}) do |result, (language_code, repo_count)|
      country_code = Language.language_code_to_country_code_map[language_code]
      result.merge({ country_code => repo_count })
    end
  end

  def self.homepage_autoplay_repo
    repo_id = Setting.get(:homepage_autoplay_repository_id).to_s.to_i
    self.find_by_id(repo_id)
  end

  def self.sample_export_instructions
    self.where(group_id: Group.first.id)
        .published
        .recent
        .first
        .try(:export_url)
  end

  def self.templates
    where("is_template is true")
  end

  def filename
    "#{self.owner}_#{self.video.name.downcase.gsub(/\s/,"_")}.srt"
  end

  def owner
    self.user.try(:username) || ANONYMOUS_USERNAME
  end

  def anonymous?
    self.user.nil?
  end

  def url(embed_repo = nil)
    (is_embed? || embed_repo) ? embed_url  : repo_url(self.token)
  end

  def embed_url
    repo_embed_url(self.token)
  end

  def group_url
    self.group.url  
  end

  def group_name
    self.group.name  
  end

  def is_embed?
    !!self.is_embed  
  end

  def favorite_url
    upvote_repository_url(self)
  end 

  def post_publish_url
    group.present? ? group.url : url
  end

  def release
    self.release_item.try(:release)
  end

  def owner_profile_url
    if user
      user.url
    else
      "#"
    end
  end

  def editor_url
    editor_repo_url(self.token)
  end

  def fork_url
    fork_repo_url(self.token)
  end

  def editor_setup_url
    editor_repo_setup_url(self.token)
  end

  def thumbnail_url
    self.video.thumbnail_url
  end

  def thumbnail_url_hq
    self.video.thumbnail_url_hq
  end

  def publish_url
    publish_repo_url(self)
  end

  def update_title_url
    update_repo_title_url(self)
  end

  def subtitle_download_url
    repo_subtitle_download_url(self)
  end

  def original?
    parent_repository_id.nil?
  end

  def forked?
    !original?
  end

  def to_srt
    self.timings.order("start_time").each_with_index.map do |timing,index|
      # get subtitle each subtitle
      "#{index + 1}\n#{timing.formatted_start_time} --> #{timing.formatted_end_time}\n#{timing.subtitle.text}\n\n"
    end.join
  end

  def guided_walkthrough?
    false
  end

  def self.guided_walkthrough
    self.joins(:video).where(["source_url = ?",'http://www.youtube.com/watch?v=6tNTcZOpZ7c']).first
  end

  def version_for(target_user)
    self.class.where("video_id = ? AND user_id = ?",self.video_id,target_user.id).first
  end

  def current_language
    language || "en"
  end

  def language_pretty
    ::Language::CODES[current_language]
  end

  def language_display
    if anonymous?
      self.language_pretty
    else
      "#{self.language_pretty} - #{self.user.username}"
    end
  end

  def full_display
    if anonymous?
      "#{self.video.name} - [#{self.language_pretty}]"
    else
      "#{self.video.name} - [#{self.language_pretty}] by #{self.user.username}"
    end
  end

  def youtube_imported?
    !!is_youtube_imported
  end

  def published_repositories
    self.video.published_repositories
  end

  def other_published_repositories
    self.published_repositories.reject{ |repo| repo == self }
  end

  def self.create_from_subtitle_file!(params)
    self.transaction do
      repo = self.create!(video: params.fetch(:video), user: params.fetch(:user), language: params.fetch(:language))
      repo.create_timings_from_subtitle_file(params.fetch(:subtitle_file))
      repo
    end
  end

  def self.language_select_options
    Language::CODES.map{|k,v| [v,k]}
  end

  def upload_subtitle_url
    upload_to_existing_repo_url(self)
  end

  def editor_upload_tab_url
    [editor_url,"#upload_tab"].join
  end

  class SRT::File::InvalidError < StandardError; end

  def create_timings_from_subtitle_file(uploaded_file)
    text = uploaded_file.read.force_encoding('UTF-8')
    srt = SRT::File.parse(text)

    raise SRT::File::InvalidError.new(format_srt_error(srt.errors)) if srt.errors.present?

    Timing.transaction do
      Timing.where(repository_id: self.id).delete_all

      srt.lines.each do |item|
        timing = Timing.new({
          repository_id: self.id,
          start_time: item.start_time,
          end_time: item.end_time,
          subtitle_attributes: {
            text: item.text.join,
            repository_id: self.id
          }
        })

        timing.save!(validate: false)
      end
    end
  end

  def format_srt_error(srt_errors)
    srt_errors.map do |error|
      index, msg, text =  error.split(",")
      "#{msg} at line #{index.to_i + 1}"
    end.join(". ")
  end


  def copy_timing_from!(other_repo)
    Timing.transaction do
      self.update_attributes!(parent_repository_id: other_repo.id)

      other_repo.timings.map do |timing|
        timing = Timing.new({
          repository_id: self.id,
          start_time: timing.start_time,
          end_time: timing.end_time,
          subtitle_attributes: {
            text: "",
            parent_text: timing.subtitle.text,
            repository_id: self.id
          }
        })

        timing.save!(validate: false)
      end
    end
  end

  def setup_translation!(source_repo = nil)
    source_repo ||= find_master_repo
    copy_timing_from!(source_repo)
  end

  # for now, related repo that contains the most timing
  def find_master_repo
    self.video.published_repositories.sort do |repo, other_repo|
      repo.timings.length <=> other_repo.timings.length
    end.first
  end

  def user_avatar_thumb_url
    user.avatar.thumb.url
  end

  def title
    if read_attribute(:title)
      self.read_attribute(:title)
    else
      ["#{language_pretty} Sub :", self.video.name].join(" ")
    end
  end

  def release_title
    if read_attribute(:title)
      self.read_attribute(:title)
    else
      video.title
    end
  end

  def player_title
    title
  end

  def video_title_for_release
    release_title == video.title ? "" : video.title
  end

  def keywords
    [language_pretty, "sub"] + self.video.name[0..255].split(" ")
  end

  def language_label
    is_template? ? self.title : language_pretty
  end


  def transcript
    self.timings.map do |timing|
      timing.subtitle.text
    end.join(". ")
  end

  def points
    get_likes.size - get_dislikes.size
  end

  def score
    points
  end

  def owned_by?(target_user)
    if user
      same_user?(target_user) || target_user.try(:is_super_admin?)
    else
      true # anonymous repo belong to everyone
    end
  end

  def same_user?(target_user)
    self.user == target_user
  end

  def same_group?(target_user)
    user_groups = Array(target_user.try(:groups))
    user_groups.include?(self.group)
  end

  def contribute_tab_class
    ""
  end

  def transcript_tab_class
    "active"
  end

  def visible_to_user?(target_user)
    is_published || owned_by?(target_user)
  end

  def email_youtube_sync_request(to_email)
    if self.youtube_sync_email_sent_to.blank?
      RepositoryMailer.youtube_sync_request(self,to_email).deliver
      self.update_column(:youtube_sync_email_sent_to, to_email) if Rails.env.production? 
    end
  end

  def uploader_human_readable_name
    video.uploader_username
  end

  def video_name
    video.name  
  end

  def video_source_url
    video.source_url  
  end

  def export_url
    "#{self.url}#export"
  end

  def serialize
    {
      :id => self.id,
      :video => self.video.serialize,
      :filename => self.filename,
      :user => self.user.try(:serialize),
      :timings => self.timings.map(&:serialize),
      :original_timings => self.serialized_original_timings,
      :url => self.url,
      :title => self.title,
      :token => self.token,
      :language_pretty => self.language_pretty,
      :owner => self.owner,
      :owner_profile_url => self.owner_profile_url,
      :editor_url => self.editor_url,
      :publish_url => self.publish_url,
      :update_title_url => self.update_title_url,
      :subtitle_download_url => self.subtitle_download_url,
      :parent_repository_id => self.parent_repository_id,
      :is_published => self.is_published,
      :is_fullscreen => self.is_fullscreen,
      :is_guided_walkthrough => self.guided_walkthrough?,
      :group => self.group.try(:serialize),
      :release => self.release.try(:serialize),
      :repository_languages => self.current_user_owned_repository_languages,
      :player_repository_languages => self.player_repository_languages,
      :highlight_subtitle_short_id => self.highlight_subtitle_short_id
    }
  end

  def serialized_original_timings
    other_repo = self.other_published_repositories.select do |repo|
      repo.language == self.video.language
    end.first  

    if other_repo && other_repo != self && !self.is_embed?
      other_repo.timings.map(&:serialize)  
    else
      nil
    end
  end

  def current_user_owned_repository_languages
    result = current_user_owned_repositories.map do |repo|
      { url: repo.editor_url, language: repo.language_pretty }
    end

    result << { url: new_translation_url(group_id: self.group.try(:short_name)), language: "-- New Translation --" }

    result
  end

  def player_repository_languages
    result = current_user_owned_and_published_repositories.map do |repo|
      url = self.is_embed? ? repo.url(:embed) : repo.url
      { url: url, language: repo.language_pretty }
    end

    if self.is_embed?
      result << { url: "#", language: "yasub.com" }
    else
      result << { url: new_translation_url(group_id: self.group.try(:short_name)), language: "- New Translation -" }
    end

    result
  end

  def new_translation_url(options = {})
    extra_params = options.reject { |k,v| v.nil? }
    self.video.translate_repository_url(extra_params.merge(source_repo_token: self.token))
  end

  def current_user_owned_and_published_repositories
    (current_user_owned_repositories + published_repositories).uniq
  end

  def current_user_owned_repositories
    self.video.repositories.select do |repo|
      repo.owned_by?(self.class.current_user)
    end
  end

  def generate_token
    unless self.token
      self.token = loop do
        random_token = SecureRandom.urlsafe_base64(8)
        break random_token unless self.class.where(token: random_token).exists?
      end
    end
  end

  def short_id
    token
  end

  def share_text
    ["[#{language_pretty} Sub]",truncate(release_title, length: 80)].join(" ")
  end

  def share_description
    if read_attribute(:title) != video.title
      video.title
    else
      self.timings[0..2].map do |timing|
        timing.subtitle.text
      end.join(". ")
    end
  end

  def auto_publish_anonymous_repo
    unless user
      self.is_published = true
    end
  end

  def repo_item_class_for(user)
    return "" unless user

    css_class = if user.liked?(self)
                  "upvoted"
                elsif user.disliked?(self)
                  "downvoted"
                else
                  ""
                end

    css_class += " negative"    if score <= 0
    css_class += " negative_1"  if score <= -1
    css_class += " negative_3"  if score <= -3
    css_class += " negative_5"  if score <= -5

    css_class
  end

  def formatted_duration
    format_time video.duration.to_i
  end

  def duration
    video.duration
  end

  def mailchimp_html
    html = <<-TEXT
      <div class="release_item" style="margin-bottom: 10px; height: 80px;">
        <div style="float: left; width: 400px;">
          <p>
            <a class="video_name " href="#{self.url}" style="box-sizing: border-box; color: rgb(51, 122, 183); text-decoration: none; margin-bottom: 0px; overflow: hidden; line-height: 12px; height: 24px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px;">
              #{self.release_title}
            </a>
            <br />
            <span style="color:rgb(119, 119, 119); font-family:helvetica neue,helvetica,arial,sans-serif; font-size:11px; line-height:17.4603176116943px">
              #{number_with_delimiter(self.video.view_count, delimiter: ",")} views
            </span>
          </p>
        </div>
        <a class="video_thumb" href="#{self.url}" style="float: right;">
          <img src="#{self.thumbnail_url}" style="width: 100px;" />
        </a>
      </div>
    TEXT
    html.gsub("\n","")
  end

  def add_tags(tag_array)
    self.tag_list.add tag_array  
    self.save
  end

  def get_thumbnail_tempfile
    @thumbnail_tempfile ||= begin
      require 'tempfile'
      require 'open-uri'

      content = open(self.thumbnail_url_hq).read

      tempfile = Tempfile.new("repo_thumbnail")
      tempfile.binmode # switch to binary mode to be able to write image (default is text)
      tempfile.write(content)
      tempfile.rewind
      tempfile
    end
  end

  def embed_code
    # large
    # embed_width = "640px"
    # embed_height = "390px"

    # medium
    embed_width = "480px"
    embed_height = "290px"

    <<-HTML.gsub(/\s+/," ")
      <iframe id="player" 
              width="#{embed_width}" 
              height="#{embed_height}" 
              frameborder="0" 
              allowfullscreen="1" 
              title="#{self.title}" 
              src="#{self.embed_url}">
      </iframe> 
    HTML
  end

  def is_downloadable?
    if is_downloadable.present? 
      !!is_downloadable
    elsif group.present? 
      group.allow_subtitle_download
    else
      user.allow_subtitle_download
    end
  end

  def to_param
    self.token
  end

end
