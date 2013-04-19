class MediaSource < ActiveRecord::Base
  attr_accessible :votes, :media_type, :url
  belongs_to :song

  validates :media_type, :url, :presence => true

  scope :highest_voted, lambda { |song_id|
    where("song_id = ?",song_id).order("votes DESC").limit(3)
  }

  # http://stackoverflow.com/questions/328525/what-is-the-best-way-to-set-default-values-in-activerecord
  after_initialize do
    self.votes ||= 0 if self.has_attribute? :votes
  end

  before_validation do
    self.media_type = self.url =~ /soundcloud/ ? "audio" : "video"
  end

  def serialize
    result = self.class.accessible_attributes.inject({}) do |result, attr|
      # rails 3.2.11, sometimes attr is blank
      unless attr == ""
        # to access client_id, you can't do self[client_id], but you can do self.client_id (its really a method, not an attribute)
        value = eval("self.#{attr}")
        result.merge!({ attr => value }) unless attr == ""
      end
      result
    end
    result.merge!({ :id => self.id})
  end

end
