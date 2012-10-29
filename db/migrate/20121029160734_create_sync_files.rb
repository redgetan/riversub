class CreateSyncFiles < ActiveRecord::Migration
  def change
    create_table :sync_files do |t|

      t.integer :song_id

      t.text :timecodes
      t.integer :rating

      t.timestamps
    end

    add_foreign_key(:sync_files, :songs)
  end
end
