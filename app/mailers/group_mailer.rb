# encoding: UTF-8

class GroupMailer < ActionMailer::Base
  @@from = "Yasub <info@yasub.com>"

  def new_comment_notify(comment)
    @comment = comment
    @group = comment.commentable
    
    @url  = "http://www.yasub.com/"
    @commenter = @comment.user.try(:username) || "Anonymous user"
    mail(:to => nil, :bcc => @group.members.map(&:email), :subject => "#{@commenter} commented on the group #{@group.name}", :from => @@from)
  end

end
