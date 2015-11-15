class AddDownloadInProgressToVideos < ActiveRecord::Migration
  def change
    add_column :videos, :download_in_progress, :boolean, :default => false
    add_column :videos, :download_failed, :boolean, :default => false
  end
end
