class CreateRepository < ActiveRecord::Migration
  def change
    create_table :repositories do |t|
      t.integer :video_id, :null => false
      t.integer :user_id, :null => false
      t.timestamps
    end

  end

end
