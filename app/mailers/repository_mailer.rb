# encoding: UTF-8

class RepositoryMailer < ActionMailer::Base
  default from: "info@yasub.com"

  def youtube_sync_request(repo, to_email)
    @repo = repo
    @url  = "http://www.yasub.com/"
    @from = "redge@yasub.com"
    mail(:to => to_email, :subject => "Your Video has been subtitled | YouTubeのビデオ字幕", :from => @from)
  end

  def new_comment_notify(comment)
    @comment = comment
    @repo = comment.commentable
    @user = @repo.user
    @url  = "http://www.yasub.com/"
    @from = "info@yasub.com"
    @commenter = @comment.user.try(:username) || "Anonymous user"
    mail(:to => @repo.user.email, :subject => "#{@commenter} commented on your subtitle #{@repo.title}", :from => @from)
  end
end
