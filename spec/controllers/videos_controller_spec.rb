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

end
