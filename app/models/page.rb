class Page < ActiveRecord::Base

  include Rails.application.routes.url_helpers

  attr_accessible :identity_id, :metadata, :short_name

  belongs_to :identity

  validates :identity_id, :presence => true

  before_validation :assign_metadata

  validates :short_name, uniqueness: true
  validates :short_name, presence: true

  serialize :metadata, JSON

  has_many :repositories


  def assign_metadata
    self.metadata = self.identity.youtube_client.get_channel_data.data.items.first.to_hash
  end

  def title
    self.metadata["snippet"]["title"]
  end

  def description
    self.metadata["snippet"]["description"]
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

  def producer_public_videos(page_token = '')
    youtube_client.producer_public_videos(page_token)
  end

  def more_uploads_url(page_token)
    page_producer_uploads_url(self, page_token: page_token)    
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

  def published_repositories
    self.repositories.published
  end

  def channel_id
    self.metadata["id"]  
  end

  def source_url
    "https://youtube.com/channel/#{channel_id}"  
  end

  def new_repository_url
    self.video.new_repository_url(page_id: self.short_name, 
                                  hide_group: group.present? ? true : nil,
                                  repo_language_code: self.language,
                                  request_id: self.id)  
  end

  def name
    title  
  end

  def url
    page_url(self)  
  end

end