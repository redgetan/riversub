class Release < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  attr_accessible :date, :is_published

  belongs_to :group
  
  has_many :release_items
  has_many :repositories, :through => :release_items

  before_create :set_release_number

  def set_release_number
    self.release_number = self.class.where(group_id: self.group.id).count + 1
  end

  def serialize
    {
      :id => self.id,
      :release_number => self.release_number,
      :date => self.date,
      :url => self.url
    }
  end

  def url
    group_release_url(self.group,self)
  end

  def to_param
    self.release_number  
  end
end
