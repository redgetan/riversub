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

  def title
    "#{self.group.title} | #{self.rss_title}"
  end

  def rss_title
    "Issue ##{self.release_number}"
  end

  def thumbnail_url_hq
    self.repositories.first.try(:thumbnail_url_hq)
  end

  def share_text
    self.title  
  end

  def share_description
    "This week's subtitled videos: #{self.repositories.map(&:release_title).join(". ")}"  
  end

  def to_param
    self.release_number  
  end

  def mailchimp_content_encoded
    release_items.order("position").map(&:repository).map do |repo|
      repo.mailchimp_html
    end.join
  end
end
