class ChangeSyncFileToTiming < ActiveRecord::Migration
  def change
    remove_foreign_key :sync_files, :songs
    
    rename_table :sync_files, :timings
    remove_column :timings, :timecode
    remove_column :timings, :votes
    add_column :timings, :start_time, :integer
    add_column :timings, :end_time, :integer

    add_foreign_key :timings, :songs
  end
end
