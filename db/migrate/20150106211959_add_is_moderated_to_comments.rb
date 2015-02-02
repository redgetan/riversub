class AddIsModeratedToComments < ActiveRecord::Migration
  def change
    add_column :comments, :is_moderated, :boolean, :default => false
  end
end
