require_dependency "public_activity"
require_dependency "vote"

class Comment < ActiveRecord::Base

  include Rails.application.routes.url_helpers
  include PublicActivity::Model

  Vote.after_save do |record|
    if record.votable.is_a? Comment  
      record.votable.assign_confidence
    end
  end

  after_create :send_notification

  acts_as_nested_set :parent_column => :parent_comment_id ,
                     :scope => [:commentable_id, :commentable_type]

  tracked :only  => :create,
          :owner => Proc.new{ |controller, model| 
            model.class.respond_to?(:current_user) ? model.class.current_user : nil
          },
          :params => {
            :group_short_name => Proc.new { |controller, model| 
              case model.commentable
              when Repository
                model.commentable.group.try(:short_name)
              else
                nil
              end
            }
          }


  validates :body, :presence => true

  attr_accessible :commentable, :body, :user_id, :comment

  attr_accessor :highlighted, :indent_level

  # NOTE: install the acts_as_votable plugin if you
  # want user to vote on the quality of comments.
  acts_as_votable

  belongs_to :user
  belongs_to :commentable, :polymorphic => true
  has_many :votes,
    :dependent => :delete_all
  belongs_to :parent_comment,
    :class_name => "Comment"


  before_validation :on => :create do
    self.assign_short_id
    self.assign_confidence
  end

  # after this many minutes old, a comment cannot be edited
  MAX_EDIT_MINS = (60 * 4)


  # Helper class method that allows you to build a comment
  # by passing a commentable object, a user_id, and comment text
  # example in readme
  def self.build_from(obj, user_id, comment)
    new \
      :commentable => obj,
      :comment     => comment,
      :user_id     => user_id
  end

  def self.highlight_comment(comments,comment_short_id)
    if comment_short_id
      comment = comments.select { |comment| comment.short_id == comment_short_id }.first
      comment.highlighted = true
    end
  end

  #helper method to check if a comment has children
  def has_children?
    self.children.any?
  end

  # Helper class method to lookup all comments assigned
  # to all commentable types for a given user.
  scope :find_comments_by_user, lambda { |user|
    where(:user_id => user.id).order('created_at DESC')
  }

  # Helper class method to look up all comments for
  # commentable class name and commentable id.
  scope :find_comments_for_commentable, lambda { |commentable_str, commentable_id|
    where(:commentable_type => commentable_str.to_s, :commentable_id => commentable_id).order('created_at DESC')
  }

  # Helper class method to look up a commentable object
  # given the commentable class name and id
  def self.find_commentable(commentable_str, commentable_id)
    commentable_str.constantize.find(commentable_id)
  end

  def self.arrange_for_user(user)
    parents = self.order("confidence DESC").group_by(&:parent_comment_id)

    # top-down list of comments, regardless of indent level
    ordered = []

    ancestors = [nil] # nil sentinel so indent_level starts at 1 without add op.
    subtree = parents[nil]

    while subtree
      if (node = subtree.shift)
        children = parents[node.id]

        # for deleted comments, if they have no children, they can be removed
        # from the tree.  otherwise they have to stay and a "[deleted]" stub
        # will be shown
        if !node.is_gone?
          # not deleted or moderated
        elsif children
          # we have child comments
        elsif user && (user.is_moderator? || node.user_id == user.id)
          # admins and authors should be able to see their deleted comments
        else
          # drop this one
          next
        end

        node.indent_level = ancestors.length
        ordered << node

        # no children to recurse
        next unless children

        # for moderated threads, remove the entire sub-tree at the moderation
        # point
        next if node.is_moderated?

        # drill down a level
        ancestors << subtree
        subtree = children
      else
        # climb back out
        subtree = ancestors.pop
      end
    end

    ordered
  end

  def assign_confidence
    self.confidence = self.calculated_confidence
  end

  def assign_short_id
    generate_token
  end

  def token;          self.short_id     ; end


  # def comment;        self.body         ; end
  # def comment=(text); self.body = text  ; end

  def comment
    self.markeddown_comment
  end

  def comment=(com)
    self.body = com.to_s.rstrip
    self.markeddown_comment = self.generated_markeddown_comment
  end

  def generated_markeddown_comment
    Markdowner.to_html(self.body)
  end


  def is_moderated?
    false # hardcode it to false for now since we dont support moderation  
  end

  def generate_token
    unless self.short_id
      self.short_id = loop do
        random_token = SecureRandom.urlsafe_base64(11)
        break random_token unless self.class.where(short_id: random_token).exists?
      end
    end
  end


  # http://evanmiller.org/how-not-to-sort-by-average-rating.html
  # https://github.com/reddit/reddit/blob/master/r2/r2/lib/db/_sorts.pyx
  def calculated_confidence
    n = (upvotes + downvotes).to_f
    if n == 0.0
      return 0
    end

    z = 1.281551565545 # 80% confidence
    p = upvotes.to_f / n

    left = p + (1 / ((2.0 * n) * z * z))
    right = z * Math.sqrt((p * ((1.0 - p) / n)) + (z * (z / (4.0 * n * n))))
    under = 1.0 + ((1.0 / n) * z * z)

    return (left - right) / under
  end


  def parent_comment
    parent
  end

  def points
    get_likes.size - get_dislikes.size
  end

  def upvotes           
    get_likes.count   
  end

  def downvotes
    get_dislikes.count 
  end

  def score;             points       ; end


  def comment_item_class_for(user)
    return "" unless user

    css_class = if user.liked?(self) 
                  "upvoted"
                elsif user.disliked?(self)
                  "downvoted"
                else 
                  ""
                end

    css_class += " highlighted" if highlighted
    css_class += " negative"    if score <= 0
    css_class += " negative_1"  if score <= -1
    css_class += " negative_3"  if score <= -3
    css_class += " negative_5"  if score <= -5
 
    css_class
  end

  def has_been_edited?
    self.updated_at && (self.updated_at - self.created_at > 1.minute)
  end

  def is_editable_by_user?(user)
    if user && user.id == self.user_id
      if self.is_moderated?
        false
      else
        (Time.now.to_i - (self.updated_at ? self.updated_at.to_i :
          self.created_at.to_i) < (60 * MAX_EDIT_MINS))
      end
    else
      false
    end
  end

  def is_deletable_by_user?(user)
    if user && user.is_admin?
      true
    elsif user && user.id == self.user_id
      true
    else
      false
    end
  end

  def delete_for_user(user)
    # Comment.record_timestamps = false

    self.is_deleted = true

    if user.is_moderator? && user.id != self.user_id
      self.is_moderated = true

      # need to implement moderation class (see lobster moderation.rb)
      fake_object = Class.new { def method_missing(method, *args, &blk); self; end }
      # m = Moderation.new
      m = fake_object
      m.comment_id = self.id
      m.moderator_user_id = user.id
      m.action = "deleted comment"
      m.save
    end

    self.save(:validate => false)
    # Comment.record_timestamps = true
  end

  def undelete_for_user(user)
    # Comment.record_timestamps = false

    self.is_deleted = false

    if user.is_moderator?
      self.is_moderated = false

      if user.id != self.user_id
        # need to implement moderation class (see lobster moderation.rb)
        fake_object = Class.new { def method_missing(method, *args, &blk); self; end }
        # m = Moderation.new
        m = fake_object
        # m = Moderation.new
        m.comment_id = self.id
        m.moderator_user_id = user.id
        m.action = "undeleted comment"
        m.save
      end
    end

    self.save(:validate => false)
    # Comment.record_timestamps = true
  end


  def is_undeletable_by_user?(user)
    if user && user.is_moderator?
      return true
    elsif user && user.id == self.user_id && !self.is_moderated?
      return true
    else
      return false
    end
  end

  def is_gone?
    is_deleted? || is_moderated?
  end

  def persisted?
    !new_record?  
  end

  def gone_text
    if self.is_moderated?
      "Thread removed by moderator " <<
        self.moderation.try(:moderator).try(:username).to_s << ": " <<
        (self.moderation.try(:reason) || "No reason given")
    else
      "Deleted by author"
    end
  end

  def send_notification
    case commentable
    when Repository
      RepositoryMailer.new_comment_notify(self).deliver
    when Group
      GroupMailer.new_comment_notify(self).deliver
    else
      nil
    end
  end

  def url
    case commentable
    when Repository
      repo_comment_url(self.commentable, self)
    when Group
      comment_group_url(self.commentable, self) + "#comments"
    else
      raise "unimplemented commentable url"
    end
  end

  def to_param
    self.short_id  
  end

end
