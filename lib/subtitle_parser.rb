module SubtitleParser

  class InvalidFormatError < StandardError; end


  # returns an array of hashes where 
  # keys are (:start_time, :end_time, :text)
  #
  def self.parse_srt(text, filename = "")
    lines = text.split(/\n{2}/).map { |section| 
      rows = section.strip.split("\n") 
      3.times.each_with_index.map { |item,index| rows[index].to_s }
    }.flatten

    sequence_nth_entry = 0  # 1
    timing_nth_entry   = 1  # 00:00:07,619 --> 00:00:11,619
    text_nth_entry     = 2  # hello world

    result = []

    lines.each_with_index do |line, index|
      entry_type = index % 3

      case entry_type
      when sequence_nth_entry
        catch_sequence_number_error(line, index, filename) do 
          result << Hash.new 
        end
      when timing_nth_entry
        catch_timing_error(line, index, filename) do 
          start_time, end_time = line.split(/\s+\-\-\>\s+/)

          start_time_seconds = parse_srt_time(start_time)
          end_time_seconds   = parse_srt_time(end_time)

          validate_start_end_time(line, index, filename, start_time, end_time)

          result.last[:start_time] = start_time_seconds
          result.last[:end_time] = end_time_seconds
        end
      when text_nth_entry
        result.last[:text] = line
      end
    end

    result
  end

  def self.validate_start_end_time(line, index, filename, start_time, end_time)
    if end_time <= start_time
      raise InvalidFormatError.new("Error at line #{index + 1} of #{filename}. " + 
        "start_time #{self.start_time} is greater than or equal to end_time #{self.end_time}")
    end
  end

  def self.catch_sequence_number_error(line, index, filename, &block) 
    entry_no   = (index / 3) + 1

    if line.to_i != entry_no
      raise InvalidFormatError.new("Error at line #{index + 1} of #{filename}. Wrong sequence number #{line}.")  
                               
    end

    block.call
  end

  def self.catch_timing_error(line, index, filename, &block) 
    begin
      block.call      
    rescue ArgumentError => e
      if e.message =~ /invalid value for Integer/
        raise InvalidFormatError.new("Error at line #{index + 1} of #{filename}. #{e.message}.")  
                                 
      end
    end
  end

  def self.catch_blank_error(line, index, filename) 
    unless line.blank?
      raise InvalidFormatError.new("Error at line #{index + 1} of #{filename}. Blank line not found.")  
                               
    end
  end

  def self.parse_srt_time(srt_time)
    primary_time, secondary_time = srt_time.to_s.split(",")  

    # use Float() would raise error if string is not numeric 
    hour, minute, second = primary_time.split(":").map { |val| Float(val).to_d }
    millisecond          = Float(secondary_time).to_d

    hour * 3600 + minute * 60 + second + millisecond * 0.001.to_d
  end

end