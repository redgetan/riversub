class CreateReleaseItems < ActiveRecord::Migration
  def change
    create_table :release_items do |t|
      t.integer :release_id
      t.integer :video_id
      t.integer :repository_id
      t.integer :position

      t.timestamps
    end
  end
end
