class RemoveRepositoryIdFromReleaseItems < ActiveRecord::Migration
  def up
    remove_column :release_items, :repository_id
  end

  def down
    add_column :release_items, :repository_id, :integer
  end
end
