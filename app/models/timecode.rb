# array representation of time_code column of SyncFile
class Timecode

  attr_accessor :data

  def initialize(data=[])
    @data = data
  end

  def self.parse(text)
    new(text.split(","))
  end

  def to_s
    @data.to_s
  end

end
