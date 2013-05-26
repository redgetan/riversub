class Timing < ActiveRecord::Base
  attr_accessible :video_id, :start_time, :end_time, :subtitle_id, :client_id,
                  :subtitle_attributes

  # used as an id to for client tracks to identify which server timing it maps to
  # useful when doing bulk updates where more than 1 track is returned back to client
  attr_accessor :client_id

  belongs_to :subtitle
  belongs_to :video

  validates :start_time, :end_time, :subtitle, :presence => true

  accepts_nested_attributes_for :subtitle

  def serialize
    result = self.class.accessible_attributes.inject({}) do |result, attr|
      # rails 3.2.11, sometimes attr is blank
      unless attr == "" || attr =~ /_attributes/
        # to access client_id, you can't do self[client_id], but you can do self.client_id (its really a method, not an attribute)
        value = eval("self.#{attr}")
        result.merge!({ attr => value }) unless attr == ""
      end
      result
    end

    result.merge!({ :id => self.id})
          .merge!({ :subtitle => self.subtitle.serialize })
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
