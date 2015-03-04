class Release < ActiveRecord::Base
  attr_accessible :date, :is_published

  belongs_to :group
  
  has_many :release_items
  has_many :repositories, :through => :release_items
end
