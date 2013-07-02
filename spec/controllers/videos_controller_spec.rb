require 'spec_helper'

describe VideosController do

  describe "GET 'show'" do
    before do
      @video = create(:video)
    end

    context "non-existing video" do
      it "returns 404" do
        get :show, :token => "not_exist"
        response.response_code.should == 404
      end
    end

    context "existing video" do
      it "returns http success" do
        get :show, :token => @video.to_param
        response.response_code.should == 200
      end
    end
  end

  describe "GET 'editor'" do
    context "anonymous repositories" do
    end
    context "user subtitled repositories" do
      before do
        @user = create(:user)
        @video = create(:video)
        @repo = create(:repository,:user => @user)
      end
      context "video does not belong to user" do
        context "anonymous user" do
          it "returns 403" do
            get :editor, :token => @video.to_param, :username => @user.to_param 
            response.response_code.should == 403
          end
        end

        context "another user" do
          before do
            @user2 = create(:user)
            sign_in @user2
          end

          it "returns 403" do
            get :editor, :token => @video.to_param, :username => @user.to_param 
            response.response_code.should == 403
          end
        end
      end

      context "video belongs to user" do
        before do
          sign_in @user
        end

        it "return success" do
          get :editor, :token => @video.to_param, :username => @user.to_param 
          response.response_code.should == 200
        end
      end
    end

  end


end
