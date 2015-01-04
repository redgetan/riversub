class RepositoriesController < ApplicationController

  def unvote
    if !(repo = find_repo)
      return render :text => "can't find repo", :status => 400
    end

    repo.unvote_by current_user

    render :text => "ok"
  end

  def upvote
    if !(repo = find_repo)
      return render :text => "can't find repo", :status => 400
    end

    unless current_user
      render :text => "You must be logged in to take the action", :status => 401 and return
    end

    repo.liked_by current_user

    render :text => "ok"
  end

  def downvote
    if !(repo = find_repo)
      return render :text => "can't find repo", :status => 400
    end

    unless current_user
      render :text => "You must be logged in to take the action", :status => 401 and return
    end

    if !current_user.can_downvote?(repo)
      return render :text => "not permitted to downvote", :status => 400
    end

    repo.disliked_by current_user

    render :text => "ok"
  end

  private

    def find_repo
      Repository.where(:token => params[:id]).first
    end

end