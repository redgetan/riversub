class UserMailer < ActionMailer::Base
  default from: "info@yasub.com"

  def welcome_email(user)
    @user = user
    @url  = "http://www.yasub.com/"
    mail(:to => user.email, :subject => "Welcome to Yasub", :from => "info@yasub.com")
  end
end
