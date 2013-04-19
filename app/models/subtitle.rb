class Subtitle < ActiveRecord::Base
  attr_accessible :text, :order

  belongs_to :song

  validates :text, :order, :presence => true
end
