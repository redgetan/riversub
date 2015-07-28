class AddPageIdToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :page_id, :integer
  end
end
