class CreateRequests < ActiveRecord::Migration
  def change
    create_table :requests do |t|
      t.integer :video_id 
      t.integer :group_id
      t.integer :submitter_id
      t.string  :language
      t.timestamps
    end

    add_index :requests, [:video_id, :group_id], :unique => true

  end
end
