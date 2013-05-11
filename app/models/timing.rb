class Timing < ActiveRecord::Base
  attr_accessible :song_id, :start_time, :end_time, :subtitle_id, :client_id,
                  :subtitle_attributes

  # used as an id to for client tracks to identify which server timing it maps to 
  # useful when doing bulk updates where more than 1 track is returned back to client
  attr_accessor :client_id

  belongs_to :subtitle
  belongs_to :song

  validates :start_time, :end_time, :presence => true

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
          .merge!({
      :subtitle => self.subtitle.serialize
    })
  end

end
