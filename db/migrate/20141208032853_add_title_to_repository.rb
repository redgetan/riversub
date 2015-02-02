class AddTitleToRepository < ActiveRecord::Migration
  def change
    add_column :repositories, :title, :string
  end
end
