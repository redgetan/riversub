class Release < ActiveRecord::Base
  attr_accessible :date, :is_published

  has_many :release_items
end
