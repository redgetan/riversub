require_dependency "vote"
require_dependency "public_activity"

class Subtitle < ActiveRecord::Base

  has_paper_trail 
  acts_as_votable

  include Rails.application.routes.url_helpers

  attr_accessible :text, :parent_text, :highlighted, :score, :short_id, :subtitle_item_class_for, :repository_id

  has_one    :timing
  belongs_to :repository
  has_many :votes, :as => :votable, :class_name => "ActsAsVotable::Vote"


  before_save :strip_crlf_text

  after_create do
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
      token = loop do
        random_token = SecureRandom.urlsafe_base64(15)
        break random_token unless self.class.where(token: random_token).exists?
      end
    end

    self.update_column(:token, token)
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

  # def subtitle_item_class_for(user)
  #   css_class = ""
  #   css_class += " positive"    if score  > 0
  #   css_class += " negative"    if score <= 0
  #   css_class += " negative_1"  if score <= -1
  #   css_class += " negative_3"  if score <= -3
  #   css_class += " negative_5"  if score <= -5

  #   return css_class unless user

  #   css_class += if user.liked?(self)
  #                  " upvoted"
  #                elsif user.disliked?(self)
  #                  " downvoted"
  #                else
  #                  ""
  #                end


  #   css_class
  # end

  def to_param
    self.token  
  end

  # def liked_by(target_user)
  #   # self.create_activity(:favorited_a_line, :owner => target_user)
  #   super
  # end

  def xss_safe_html_content(str)
    str.gsub("<","[")
       .gsub(">","]")
  end

  def serialize
    {
      :id => self.id,
      :text => xss_safe_html_content(self.text),
      :parent_text => xss_safe_html_content(self.parent_text.to_s),
      :short_id => self.short_id,
      # :subtitle_item_class_for => self.subtitle_item_class_for(self.class.current_user)
    }
  end

end
