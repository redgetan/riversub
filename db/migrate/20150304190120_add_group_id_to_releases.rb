class AddGroupIdToReleases < ActiveRecord::Migration
  def change
    add_column :releases, :group_id, :integer
  end
end
