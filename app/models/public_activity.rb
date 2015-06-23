class PublicActivity::Activity

  def self.where_params(args)
    # based on https://github.com/airblade/paper_trail/blob/v3.0.8/lib/paper_trail/version_concern.rb#L73
    arel_field = arel_table[:parameters]

    where_conditions = args.map do |field, value|
      arel_field.matches("%#{field}: #{value}\n%")
    end.reduce do |condition1, condition2|
      condition1.and(condition2)
    end

    where(where_conditions)
  end

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
    elsif trackable_type == "Group"  
      "glyphicon glyphicon-plus"  
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
    elsif trackable_type == "Group"  
      "created group"
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
    elsif trackable_type == "Group"  
      ""
    end
  end

  def resource_url
    if trackable_type == "ActsAsVotable::Vote" 
      trackable.votable.url
    elsif trackable_type == "Comment"  
      trackable.commentable.url
    elsif trackable_type == "Group"  
      trackable.url
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
    elsif trackable_type == "Group"  
      trackable.name
    end
  end
end