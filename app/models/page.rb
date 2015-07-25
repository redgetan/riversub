class Page < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  attr_accessible :identity_id, :metadata, :short_name

  belongs_to :identity

  validates :identity_id, :presence => true

  before_validation :assign_metadata

  validates :short_name, uniqueness: true
  validates :short_name, presence: true

  def assign_metadata
    self.metadata = self.identity.youtube_client.get_channel_data.data.items.first.to_hash
  end

  def title
    self.metadata["snippet"]["title"]
  end

  def description
    self.metadata["snippet"]["title"]
  end

  def thumbnail_url
    self.metadata["snippet"]["thumbnails"]["default"]["url"]
  end

  def user
    identity.user  
  end

  def to_param
    self.short_name  
  end

  def youtube_identity
    identity
  end

  def youtube_client
    youtube_identity.try(:youtube_client)
  end

  def producer_public_videos
    youtube_client.producer_public_videos
  end


  def owned_by?(target_user)
    user == target_user   
  end

  def self.human_attribute_name(attr, options={})
    if attr.to_sym == :short_name
      "Name"
    else
      super
    end
  end

  def url
    page_url(self)  
  end

end