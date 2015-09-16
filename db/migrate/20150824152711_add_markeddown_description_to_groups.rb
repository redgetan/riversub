class AddMarkeddownDescriptionToGroups < ActiveRecord::Migration
  def change
    add_column :groups, :markeddown_description, :text
  end
end
