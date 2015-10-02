class UserMailer < ActionMailer::Base
  @@from =  "Yasub <info@yasub.com>"

  def welcome_email(user)
    @user = user
    @url  = "http://www.yasub.com/"
    @from = @@from
    mail(:to => user.email, :subject => "Welcome to Yasub", :from => @@from)
  end

  def signup_notify(user)
    @user = user
    @to = "info@yasub.com"
    mail(:to => @to, :subject => "#{@user.username} signed up to yasub", :from => @@from, :body => "user signup notify.")
  end

end
