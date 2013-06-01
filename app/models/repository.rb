class Repository < ActiveRecord::Base

  include Rails.application.routes.url_helpers 

  belongs_to :video
  belongs_to :user

  has_many :subtitles
  has_many :timings

  attr_accessible :video_id, :user_id
  
  validates :video_id, :presence => true

  def name
    "#{self.owner}_#{self.video.name}"
  end

  def owner
    self.user.try(:username) || "default"  
  end

  def url
    if self.user
      editor_user_video_path(self.user,self.video) 
    else
      editor_video_path(self.video) 
    end
  end

  def thumbnail_url
    self.video.metadata["data"]["thumbnail"]["sqDefault"]
  end

  def subtitle_download_url
    repository_timings_path(self)
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
