class AddDownloadSourceToVideo < ActiveRecord::Migration
  def change
    add_column :videos, :download_progress, :integer
    add_column :videos, :source_file_path, :text
  end
end
