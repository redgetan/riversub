class AddShortNameIndexToGroups < ActiveRecord::Migration
  def change
    add_index :groups, :short_name, :unique => true
  end
end
