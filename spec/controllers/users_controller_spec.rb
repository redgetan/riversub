require 'spec_helper'

describe UsersController do

  describe "GET 'show'" do

    before do
      NOT WORKING
      @user = create(:user)
    end

    it "returns http success" do
      get :show, :username => @user.to_param 
      response.should be_success
    end

    context "profile does not belong to user" do
      context "not signed in" do
        it "should not show new project button" do
          get :show, :username => @user.to_param 
          response.body.include?("new_project_user_btn").should == false
        end
      end

      context "signed in as another user" do
        before do
          @user2 = create(:user)
          sign_in @user2
        end

        it "should not show new project button" do
          get :show, :username => @user.to_param 
          response.body.include?("new_project_user_btn").should == false
        end
      end
    end

    context "signed as same user" do
      before do
        sign_in @user
      end

      it "should show new project button" do
        routes.draw { get :show, :username => @user.to_param }
        response.body.include?("new_project_user_btn").should == true
      end
    end

  end

end
