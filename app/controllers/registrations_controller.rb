class RegistrationsController < Devise::RegistrationsController
  include DeviseHelper

  def create
    super
    UserMailer.welcome_email(@user).deliver unless @user.invalid?
  end

  # https://github.com/plataformatec/devise/wiki/How-To%3a-Allow-users-to-edit-their-account-without-providing-a-password
  def update
    @user = User.find(current_user.id)

    successfully_updated = if needs_password?(@user, params)
      @user.update_with_password(params[:user])
    else
      # remove the virtual current_password attribute update_without_password
      # doesn't know how to ignore it
      params[:user].delete(:current_password)
      @user.update_without_password(params[:user])
    end

    if successfully_updated
      set_flash_message :notice, :updated
      # Sign in the user bypassing validation in case his password changed
      sign_in @user, :bypass => true

      text = <<-HTML
      <div class='flash alert alert-success'>
        <button type='button' class='close' data-dismiss='alert'>&times;</button>
        Successfully Updated!
      </div>
      HTML

      render :text => text
    else
      render :text => devise_error_messages! , :status => 400
    end
  end

  def change_avatar
    @user = User.find(current_user.id)
    @user.avatar = params[:user][:avatar]
    if @user.save
      render :text => @user.avatar.url
    else 
      render :text => devise_error_messages!, :status => 400
    end
  end

  private

  # check if we need password to update user data
  # ie if password or email was changed
  # extend this as needed
  def needs_password?(user, params)
    user.email != params[:user][:email] ||
      !params[:user][:password].blank?
  end
end