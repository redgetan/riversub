module SubtitleParser

  # returns an array of hashes where 
  # keys are (:start_time, :end_time, :text)
  #
  def self.parse_srt(text)
    lines = text.split("\n")

    sequence_nth_entry = 0  # 1
    timing_nth_entry   = 1  # 00:00:07,619 --> 00:00:11,619
    text_nth_entry     = 2  # hello world
    blank_nth_entry    = 3  #

    timings = lines.select.each_with_index { |str, index| index % 4 == timing_nth_entry } 
    texts   = lines.select.each_with_index { |str, index| index % 4 == text_nth_entry } 

    timings.each_with_index.map do |timing, index|
      start_time, end_time = timing.split(/\s+\-\-\>\s+/)

      start_time_seconds = parse_srt_time(start_time)
      end_time_seconds   = parse_srt_time(end_time)

      { start_time: start_time_seconds, end_time: end_time_seconds, text: texts[index] }
    end
  end

  def self.parse_srt_time(srt_time)
    primary_time, secondary_time = srt_time.split(",")  
    hour, minute, second = primary_time.split(":").map(&:to_i)
    millisecond          = secondary_time.to_i

    hour * 3600 + minute * 60 + second + millisecond * 0.001
  end

end