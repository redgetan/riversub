class UserMailer < ActionMailer::Base
  default from: "noreply@zeroplay.net"

  def welcome_email(user)
    @user = user
    @url  = "http://www.zeroplay.net/"
    mail(:to => user.email, :subject => "Welcome to River Subtitles")
  end
end
