class AddShortNameToGroups < ActiveRecord::Migration
  def change
    add_column :groups, :short_name, :string, :null => false
  end
end
