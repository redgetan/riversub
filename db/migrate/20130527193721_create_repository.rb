class CreateRepository < ActiveRecord::Migration
  def change
    create_table :repositories do |t|
      t.integer :video_id, :null => false
      t.integer :user_id
      t.timestamps
    end

  end

end
