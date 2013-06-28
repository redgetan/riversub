class UserMailer < ActionMailer::Base
  default from: "noreply@riversub.cc"

  def welcome_email(user)
    @user = user
    @url  = "http://www.riversub.cc/"
    mail(:to => user.email, :subject => "Welcome to River Subtitles")
  end
end
