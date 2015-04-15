class Subtitle < ActiveRecord::Base

  has_paper_trail 
  acts_as_votable

  include Rails.application.routes.url_helpers

  attr_accessible :text, :parent_text, :highlighted, :score, :short_id, :subtitle_item_class_for

  has_one    :timing
  belongs_to :repository

  before_save :strip_crlf_text

  before_validation :on => :create do
    self.assign_short_id
  end

  def strip_crlf_text
    self.text.gsub!("\n"," ")
  end

  def url
    repo_subtitle_url(self.repository, self)  
  end

  def assign_short_id
    generate_token
  end

  def generate_token
    unless self.token
      self.token = loop do
        random_token = SecureRandom.urlsafe_base64(15)
        break random_token unless self.class.where(token: random_token).exists?
      end
    end
  end

  def short_id
    token  
  end

  def points
    get_likes.size - get_dislikes.size
  end

  def score
    points
  end

  def subtitle_item_class_for(user)
    css_class = ""
    css_class += " positive"    if score  > 0
    css_class += " negative"    if score <= 0
    css_class += " negative_1"  if score <= -1
    css_class += " negative_3"  if score <= -3
    css_class += " negative_5"  if score <= -5

    return css_class unless user

    css_class += if user.liked?(self)
                   " upvoted"
                 elsif user.disliked?(self)
                   " downvoted"
                 else
                   ""
                 end


    css_class
  end

  def to_param
    self.token  
  end

  def serialize
    {
      :id => self.id,
      :text => self.text,
      :parent_text => self.parent_text.to_s,
      :score => self.score,
      :short_id => self.short_id,
      :subtitle_item_class_for => self.subtitle_item_class_for(self.class.current_user)
    }
  end

end
