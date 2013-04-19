class ChangeTimingStartEndToFloat < ActiveRecord::Migration
  def up
    change_column :timings, :start_time, :float
    change_column :timings, :end_time,   :float
  end

  def down
    change_column :timings, :start_time, :integer
    change_column :timings, :end_time,   :integer
  end
end
