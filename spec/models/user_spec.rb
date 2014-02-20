require 'spec_helper'

describe User do
  describe "#normalize_username" do
    it "should convert space to _ and downcase string" do
    end
  end

  describe "#ensure_uniqueness_of_username" do
    context "already taken" do
      context "1 iteration to find uniqueness" do
        it "should be unique" do
        end
      end

      context "more than 1 iteration to find uniqueness" do
        it "should be unique" do
        end
      end
    end
  end

  describe "#creating_with_omniauth" do
    context "username already taken" do
      it "should generate unique username" do
        
      end
    end
  end
end
