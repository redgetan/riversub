class ChangeSyncFileToTiming < ActiveRecord::Migration
  def change
    rename_table :sync_files, :timings
    remove_column :timings, :timecode
    remove_column :timings, :votes
    add_column :timings, :start_time, :integer
    add_column :timings, :end_time, :integer
    add_column :timings, :subtitle_id, :integer
  end

end
