class AddCustomThumbnailToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :custom_thumbnail_url, :text
  end
end
