class AddIsDownloadableToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :is_downloadable, :boolean
  end
end
