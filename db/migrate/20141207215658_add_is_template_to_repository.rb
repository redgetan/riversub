class AddIsTemplateToRepository < ActiveRecord::Migration
  def change
    add_column :repositories, :is_template, :boolean, :default => false
  end
end
