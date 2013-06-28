require 'spec_helper'

describe Video do
  before do
    @video = create(:video)
  end

  describe "#create" do
    it "should have a token" do
      @video.token.should_not be_nil
    end

  end
end
