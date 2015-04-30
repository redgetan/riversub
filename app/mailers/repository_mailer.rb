# encoding: UTF-8

class RepositoryMailer < ActionMailer::Base
  default from: "info@yasub.com"

  def youtube_sync_request(repo, to_email)
    @repo = repo
    @url  = "http://www.yasub.com/"
    @from = "redge@yasub.com"
    mail(:to => to_email, :subject => "Your Video has been subtitled | YouTubeのビデオ字幕", :from => @from)
  end
end
