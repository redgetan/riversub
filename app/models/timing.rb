class Timing < ActiveRecord::Base

  has_paper_trail

  attr_accessible :video_id, :start_time, :end_time, :subtitle_id, :client_id,
                  :subtitle_attributes, :repository_id

  belongs_to :subtitle, :dependent => :destroy
  belongs_to :repository

  validates :start_time, :end_time, :subtitle, :presence => true

  # validate :end_time_must_be_greater_than_start_time
  # validate :no_track_overlap

  accepts_nested_attributes_for :subtitle

  after_save :touch_parent
  after_save :set_subtitle_repository

  def touch_parent
    self.repository.touch if self.repository
  end

  def set_subtitle_repository
    unless self.subtitle.repository_id  
      self.subtitle.update_column(:repository_id, self.repository_id)
    end

    unless self.subtitle.repository_token  
      self.subtitle.update_column(:repository_token, self.repository.try(:token)) 
    end
  end

  def end_time_must_be_greater_than_start_time
    return if self.end_time.nil? || self.start_time.nil?

    if self.end_time <= self.start_time
      errors.add(:end_time, "start_time #{self.start_time} is greater than or equal to end_time #{self.end_time}")
    end
  end

  def no_track_overlap
    tracks = []

    self.repository.timings.each do |track|
      if self != track && track.start_time <= self.start_time && self.start_time < track.end_time
        tracks << track
        tracks << self
      end
    end

    if tracks.length != 0
      errors.add(:end_time, "track overlap detected between #{tracks.join(" and ")} ")
    end
  end

  def to_s
    "Track(#{self.start_time},#{self.end_time})"
  end

  def serialize
    {
      :id => self.id,
      :start_time => self.start_time,
      :end_time => self.end_time,
      :subtitle => self.subtitle.serialize,
      :subtitle_id => self.subtitle_id,
      :repository_id => self.repository_id
    }
  end

  def formatted_start_time
    formatted_time(self.start_time)
  end

  def formatted_end_time
    formatted_time(self.end_time)
  end

  def formatted_time(time)
    hours = ( time / 3600 ).floor % 24
    minutes = ( time / 60 ).floor % 60
    seconds = (time % 60).floor
    milliseconds = (time * 1000).floor % 1000

    hours = (hours < 10 ? "0#{hours}" : hours)
    minutes = (minutes < 10 ? "0#{minutes}" : minutes)
    seconds = (seconds  < 10 ? "0#{seconds}" : seconds)
    milliseconds = (milliseconds  < 10 ? "00#{milliseconds}" : (milliseconds < 100 ? "0#{milliseconds}" : milliseconds))

    "#{hours}:#{minutes}:#{seconds},#{milliseconds}"
  end

end
