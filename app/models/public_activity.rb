class PublicActivity::Activity
  def icon_class
    case key
    when "acts_as_votable_vote.create"
      "glyphicon glyphicon-heart"  
    else
    end
  end

  def action_description
    if trackable_type == "ActsAsVotable::Vote" 
      if trackable.votable_type == "Subtitle"
        "favorited a"
      elsif trackable.votable_type == "Repository"
        "bookmarked a"
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
    end
  end

  def resource_url
    trackable.votable.url
  end

  def details
    if trackable_type == "ActsAsVotable::Vote" 
      if trackable.votable_type == "Subtitle"
        trackable.votable.text  
      elsif trackable.votable_type == "Repository"
        trackable.votable.title
      end
    end
  end
end