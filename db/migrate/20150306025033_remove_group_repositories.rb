class RemoveGroupRepositories < ActiveRecord::Migration
  def up
    drop_table :group_repositories
  end

  def down
    create_table :group_repositories do |t|
      t.integer :group_id
      t.integer :repository_id

      t.timestamps
    end
  end
end
