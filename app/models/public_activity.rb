class PublicActivity::Activity
  def icon_class
    if trackable_type == "ActsAsVotable::Vote" 
      if trackable.votable_type == "Subtitle"
        "glyphicon glyphicon-heart"  
      elsif trackable.votable_type == "Repository"
        "glyphicon glyphicon-plus"  
      end
    elsif trackable_type == "Comment"  
      if trackable.commentable_type == "Repository"
        "glyphicon glyphicon-comment"
      end
    end
  end

  def action_description
    if trackable_type == "ActsAsVotable::Vote" 
      if trackable.votable_type == "Subtitle"
        "favorited a"
      elsif trackable.votable_type == "Repository"
        "bookmarked a"
      end
    elsif trackable_type == "Comment"  
      if trackable.commentable_type == "Repository"
        "commented on a"
      end
    end
  end

  def resource_name
    if trackable_type == "ActsAsVotable::Vote" 
      if trackable.votable_type == "Subtitle"
        "line"
      elsif trackable.votable_type == "Repository"
        "video"
      end
    elsif trackable_type == "Comment"  
      if trackable.commentable_type == "Repository"
        "video"
      end
    end
  end

  def resource_url
    if trackable_type == "ActsAsVotable::Vote" 
      trackable.votable.url
    elsif trackable_type == "Comment"  
      trackable.commentable.url
    end
  end

  def details
    if trackable_type == "ActsAsVotable::Vote" 
      if trackable.votable_type == "Subtitle"
        trackable.votable.text  
      elsif trackable.votable_type == "Repository"
        trackable.votable.title
      end
    elsif trackable_type == "Comment"  
      trackable.body
    end
  end
end