class CreateGroupRepositories < ActiveRecord::Migration
  def change
    create_table :group_repositories do |t|
      t.integer :group_id
      t.integer :repository_id

      t.timestamps
    end
  end
end
