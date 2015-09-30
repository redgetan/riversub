class AddSourceTypeToVideos < ActiveRecord::Migration
  def change
    add_column :videos, :source_type, :string
  end
end
