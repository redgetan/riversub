class AddCreatorIdToGroup < ActiveRecord::Migration
  def change
    add_column :groups, :creator_id, :integer
  end
end
