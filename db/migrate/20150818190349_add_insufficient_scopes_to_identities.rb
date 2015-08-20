class AddInsufficientScopesToIdentities < ActiveRecord::Migration
  def change
    add_column :identities, :insufficient_scopes, :text
  end
end
