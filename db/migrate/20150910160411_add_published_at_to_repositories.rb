class AddPublishedAtToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :published_at, :datetime
  end
end
