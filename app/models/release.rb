class Release < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  attr_accessible :date, :is_published

  belongs_to :group
  
  has_many :release_items
  has_many :repositories, :through => :release_items

  before_create :set_release_number

  scope :published,             where("is_published is true")

  def set_release_number
    self.release_number = self.class.where(group_id: self.group.id).count + 1
  end

  def publish
    Release.transaction do 
      self.repositories.update_all("is_published = 1")
      self.update_column(:is_published, 1)
    end
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

  def publish_url
    publish_group_release_url(self.group,self)  
  end

  def to_param
    self.release_number  
  end
end
