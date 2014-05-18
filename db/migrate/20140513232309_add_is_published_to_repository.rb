class AddIsPublishedToRepository < ActiveRecord::Migration
  def change
    add_column :repositories, :is_published, :boolean
  end
end
