class AddGroupIdAndReleaseItemIdToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :group_id, :integer
    add_column :repositories, :release_item_id, :integer
  end
end
