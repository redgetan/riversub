class AddIsYoutubeImportedToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :is_youtube_imported, :boolean, :default => false
  end
end
