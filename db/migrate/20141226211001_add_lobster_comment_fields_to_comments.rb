class AddLobsterCommentFieldsToComments < ActiveRecord::Migration
  def change
    add_column :comments, :is_deleted, :boolean, default: false
    add_column :comments, :confidence, :decimal, precision: 20, scale: 19, default: 0.0, null: false
    add_column :comments, :short_id,   :string  
  end
end
