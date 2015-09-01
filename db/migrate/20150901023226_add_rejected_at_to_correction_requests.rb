class AddRejectedAtToCorrectionRequests < ActiveRecord::Migration
  def change
    add_column :correction_requests, :rejected_at, :datetime
  end
end
