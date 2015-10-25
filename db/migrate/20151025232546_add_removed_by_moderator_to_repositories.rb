class AddRemovedByModeratorToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :is_removed_by_moderator, :boolean, :default => false
    add_column :repositories, :moderator_id, :integer
  end
end
