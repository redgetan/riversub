class AddMetadataToSongs < ActiveRecord::Migration
  def up
    add_column(:songs, :metadata, :text)
  end

  def down
    remove_column(:songs, :metadata)
  end
end
