class Repository < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  belongs_to :video
  belongs_to :user

  has_many :subtitles
  has_many :timings

  attr_accessible :video_id, :user_id

  validates :video_id, :presence => true

  # scope :with_timings_count, select("repositories.*, COUNT(timings.id) timings_count")
  #                              .joins("LEFT JOIN timings on repositories.id = timings.repository_id")
  #                              .group("repositories.id")
  
  scope :anonymously_subtitled, where("user_id IS NULL")
  scope :user_subtitled,        where("user_id IS NOT NULL")
  scope :recent,                order("updated_at DESC")

  def name
    "#{self.owner}_#{self.video.name}"
  end

  def owner
    self.user.try(:username) || "default"
  end

  def url
    if self.user
      user_video_url(self.user,self.video)
    else
      video_url(self.video)
    end
  end

  def owner_profile_url
    if self.user
      user_url(self.user)
    else
      "#"
    end
  end


  def editor_url
    if self.user
      editor_user_video_url(self.user,self.video)
    else
      editor_video_url(self.video)
    end
  end

  def thumbnail_url
    self.video.metadata["data"]["thumbnail"]["sqDefault"]
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


  def serialize
    {
      :id => self.id,
      :video => self.video.serialize,
      :user => self.user.try(:serialize),
      :timings => self.timings.map(&:serialize)
    }
  end

end
