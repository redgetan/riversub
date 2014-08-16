class AddParentRepositoryIdtoRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :parent_repository_id, :integer
  end
end
