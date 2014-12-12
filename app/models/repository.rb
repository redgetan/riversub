class Repository < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  paginates_per 20
  acts_as_votable

  belongs_to :video
  belongs_to :user

  has_many :subtitles
  has_many :timings

  has_many :group_repositories
  has_many :groups, through: :group_repositories

  attr_accessible :video_id, :user_id, :video, :user, :token, 
                  :is_published, :language, :parent_repository_id, :title

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
  scope :templates,             where("is_template is true")

  GUIDED_WALKTHROUGH_YOUTUBE_URL = "http://www.youtube.com/watch?v=6tNTcZOpZ7c"
  ANONYMOUS_USERNAME = "default"

  def self.recent_user_subtitled_published_ids(num_of_entries = 10)
    Repository.select("max(id) AS repo_id")
              .published
              .user_subtitled
              .recent
              .group("user_id")
              .limit(num_of_entries)
              .map(&:repo_id)  
  end

  def self.homepage_autoplay_repo
    repo_id = Setting.get(:homepage_autoplay_repository_id).to_s.to_i
    self.find_by_id(repo_id)
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

  def url
    video_url(self.token)
  end

  def owner_profile_url
    if user
      user.url
    else
      "#"
    end
  end

  def editor_url
    editor_video_url(self.token)
  end

  def fork_url
    fork_repo_url(self.token)  
  end

  def editor_setup_url
    editor_video_setup_url(self.token)
  end

  def thumbnail_url
    self.video.metadata["data"]["thumbnail"]["sqDefault"]
  end

  def thumbnail_url_hq
    self.video.metadata["data"]["thumbnail"]["hqDefault"]
  end

  def publish_url
    publish_videos_url(self)
  end

  def upvote_url
    upvote_repo_url(self)
  end

  def downvote_url
    downvote_repo_url(self)
  end

  def update_title_url
    update_repo_title_url(self)  
  end

  def subtitle_download_url
    repository_timings_url(self)
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
    self.joins(:video).where(["url = ?",'http://www.youtube.com/watch?v=6tNTcZOpZ7c']).first
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

  def copy_timing_from!(other_repo)
    Timing.transaction do
      self.update_attributes!(parent_repository_id: other_repo.id)

      other_repo.timings.map do |timing|
        Timing.create!({
          repository_id: self.id,
          start_time: timing.start_time,
          end_time: timing.end_time,
          subtitle_attributes: {
            text: "",
            parent_text: timing.subtitle.text
          }
        })
      end
    end
  end

  def user_avatar_thumb_url
    user.avatar.thumb.url
  end

  def transcript
    self.timings.map do |timing|
      timing.subtitle.text
    end.join(". ")
  end

  def points
    get_likes.size - get_dislikes.size
  end

  def upvote_btn_class_for(user)
    if user && user.liked?(self)
      "user_voted"
    else
      ""
    end
  end

  def downvote_btn_class_for(user)
    if user && user.disliked?(self)
      "user_voted"
    else
      ""
    end
  end

  def vote_points_display_class_for(user)
    if user && (user.liked?(self) || user.disliked?(self))
      "user_voted"
    else 
      ""
    end
  end

  def owned_by?(target_user)
    if user
      self.user == target_user 
    else
      true # anonymous repo belong to everyone
    end
  end

  def display_edit?(target_user)
    target_user && self.user == target_user 
  end

  def visible_to_user?(target_user)
   is_published? || owned_by?(target_user)
  end

  def serialize
    {
      :id => self.id,
      :video => self.video.serialize,
      :filename => self.filename,
      :user => self.user.try(:serialize),
      :timings => self.timings.map(&:serialize),
      :url => self.url,
      :title => self.title,
      :token => self.token,
      :language_pretty => self.language_pretty,
      :owner => self.owner,
      :owner_profile_url => self.owner_profile_url,
      :editor_url => self.editor_url,
      :publish_url => self.publish_url,
      :upvote_url => self.upvote_url,
      :downvote_url => self.downvote_url,
      :update_title_url => self.update_title_url,
      :subtitle_download_url => self.subtitle_download_url,
      :parent_repository_id => self.parent_repository_id,
      :is_published => self.is_published,
      :is_guided_walkthrough => self.guided_walkthrough?
    }
  end

  def generate_token
    unless self.token
      self.token = loop do
        random_token = SecureRandom.urlsafe_base64(8)
        break random_token unless self.class.where(token: random_token).exists?
      end
    end
  end

  def auto_publish_anonymous_repo
    unless user
      self.is_published = true
    end
  end

  def to_param
    self.token  
  end

end
