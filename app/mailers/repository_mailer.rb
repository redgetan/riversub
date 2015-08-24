# encoding: UTF-8

class RepositoryMailer < ActionMailer::Base
  @@from = "Yasub <info@yasub.com>"

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
    @commenter = @comment.user.try(:username) || "Anonymous user"
    mail(:to => @repo.user.email, :subject => "#{@commenter} commented on your subtitle #{@repo.title}", :from => @@from)
  end

  def import_caption_failure(repo, message, actor)
    @repo = repo
    @url  = "http://www.yasub.com/"
    mail(:to => @from, :subject => "Import caption failure for repo #{@repo.id} by user #{actor.try(:username)} ", :from => @@from,
         :body => message)
  end

  def group_repo_published_notify(repo, members)
    @repo = repo
    @url  = "http://www.yasub.com/"
    mail(:to => nil, :bcc => members.map(&:email), :subject => "#{@repo.owner} has been subtitled a video for #{@repo.group.name} members", :from => @@from)
  end
end
