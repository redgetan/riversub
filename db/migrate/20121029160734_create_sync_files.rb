class CreateSyncFiles < ActiveRecord::Migration
  def change
    create_table :sync_files do |t|

      t.integer :song_id, :null => false

      t.text :timecode
      t.integer :votes

      t.timestamps
    end

    add_foreign_key(:sync_files, :songs)
  end
end
