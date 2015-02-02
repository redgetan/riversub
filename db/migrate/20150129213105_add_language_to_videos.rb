class AddLanguageToVideos < ActiveRecord::Migration
  def change
    add_column :videos, :language, :string 
  end
end
