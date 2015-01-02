class CommentsController < ApplicationController

  before_filter :alias_user

  def create
    # needs :commentable_id, :comment, :parent_id
    # needs commentbox,postedreply
    @repo = Repository.find_by_token! params[:commentable_short_id]

    unless current_user
      render :json => {}, :status => 401 and return
    end

    comment = Comment.build_from(@repo, current_user.id, params[:comment].to_s)

    if params[:parent_comment_short_id].present? 
      if parent_comment = Comment.where(commentable_id: @repo.id, 
                                        short_id: params[:parent_comment_short_id]).first
        comment.parent = parent_comment
      else
        render :json => { :error => "invalid parent comment" }, :status => 400 and return
      end
    end

    # prevent double-clicks of the post button
    if parent_comment = Comment.where(:commentable_id => @repo.id,
                                      :user_id => current_user.id,
                                      :parent_comment_id => comment.parent_comment_id).first

      if (Time.now - parent_comment.created_at) < 5.minutes
        comment.errors.add(:comment, "^You have already posted a comment here recently.")

        render :partial => "commentbox", :layout => false,
          :content_type => "text/html", :locals => { :comment => comment } and return
      end
    end

    comment.save
    comment.liked_by current_user

    render :partial => "comments/postedreply", :layout => false,
           :content_type => "text/html", :locals => { :comment => comment }
  end

  def show
    if !((comment = find_comment) && comment.is_editable_by_user?(@user))
      return render :text => "can't find comment", :status => 400
    end

    render :partial => "comment", :layout => false,
      :content_type => "text/html", :locals => { :comment => comment }
  end

  def edit
    if !((comment = find_comment) && comment.is_editable_by_user?(@user))
      return render :text => "can't find comment", :status => 400
    end

    render :partial => "commentbox", :layout => false,
      :content_type => "text/html", :locals => { :comment => comment }
  end

  def reply
    if !(parent_comment = find_comment)
      return render :text => "can't find comment", :status => 400
    end

    comment = Comment.new
    comment.commentable = parent_comment.commentable
    comment.parent_comment = parent_comment

    render :partial => "commentbox", :layout => false,
      :content_type => "text/html", :locals => { :comment => comment }
  end

  def delete
    if !((comment = find_comment) && comment.is_deletable_by_user?(@user))
      return render :text => "can't find comment", :status => 400
    end

    comment.delete_for_user(@user)

    render :partial => "comment", :layout => false,
      :content_type => "text/html", :locals => { :comment => comment }
  end

  def undelete
    if !((comment = find_comment) && comment.is_undeletable_by_user?(@user))
      return render :text => "can't find comment", :status => 400
    end

    comment.undelete_for_user(@user)

    render :partial => "comment", :layout => false,
      :content_type => "text/html", :locals => { :comment => comment }
  end

  def update
    if !((comment = find_comment) && comment.is_editable_by_user?(@user))
      return render :text => "can't find comment", :status => 400
    end

    comment.comment = params[:comment]
    comment.save

    render :partial => "comments/comment", :layout => false,
      :content_type => "text/html", :locals => { :comment => comment }
  end

  def unvote
    if !(comment = find_comment)
      return render :text => "can't find comment", :status => 400
    end

    comment.unvote_by current_user

    render :text => "ok"
  end

  def upvote
    if !(comment = find_comment)
      return render :text => "can't find comment", :status => 400
    end

    unless current_user
      render :text => "You must be logged in to take the action" :status => 401 and return
    end

    comment.liked_by current_user

    render :text => "ok"
  end

  def downvote
    if !(comment = find_comment)
      return render :text => "can't find comment", :status => 400
    end
    
    unless current_user
      render :text => "You must be logged in to take the action" :status => 401 and return
    end

    if !current_user.can_downvote?(comment)
      return render :text => "not permitted to downvote", :status => 400
    end

    comment.disliked_by current_user

    render :text => "ok"
  end

  # def index
  #   @rss_link ||= { :title => "RSS 2.0 - Newest Comments",
  #     :href => "/comments.rss#{@user ? "?token=#{@user.rss_token}" : ""}" }

  #   @heading = @title = "Newest Comments"
  #   @cur_url = "/comments"

  #   @page = 1
  #   if params[:page].to_i > 0
  #     @page = params[:page].to_i
  #   end

  #   @comments = Comment.where(
  #     :is_deleted => false, :is_moderated => false
  #   ).order(
  #     "created_at DESC"
  #   ).offset(
  #     (@page - 1) * COMMENTS_PER_PAGE
  #   ).limit(
  #     COMMENTS_PER_PAGE
  #   ).includes(
  #     :user, :story
  #   )

  #   if @user
  #     @votes = Vote.comment_votes_by_user_for_comment_ids_hash(@user.id,
  #       @comments.map{|c| c.id })

  #     @comments.each do |c|
  #       if @votes[c.id]
  #         c.current_vote = @votes[c.id]
  #       end
  #     end
  #   end
  # end

  private

    def alias_user
      @user = current_user
    end

    def find_comment
      Comment.where(:short_id => params[:id]).first
    end


end
