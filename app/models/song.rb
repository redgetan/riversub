class Song < ActiveRecord::Base
  attr_accessible :artist, :genre, :lyrics, :name
end
