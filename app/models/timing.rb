class Timing < ActiveRecord::Base
  attr_accessible :start_time, :end_time
  belongs_to :song

  validates :start_time, :end_time, :presence => true

end
