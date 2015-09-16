class CreateCorrectionRequests < ActiveRecord::Migration
  def change
    create_table :correction_requests do |t|
      t.integer :subtitle_id, :null => false
      t.integer :repository_id, :null => false
      t.integer :requester_id 
      t.integer :approver_id 
      t.text    :correction_text 
      t.boolean :is_approved 
      t.datetime :approved_at 
      t.timestamps
    end

    add_index :correction_requests, :subtitle_id
    add_index :correction_requests, :repository_id
    add_index :correction_requests, :requester_id
    add_index :correction_requests, :approver_id

  end
end
