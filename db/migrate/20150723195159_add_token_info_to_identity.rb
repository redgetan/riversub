class AddTokenInfoToIdentity < ActiveRecord::Migration
  def change
    add_column :identities, :token, :string
    add_column :identities, :refresh_token, :string
    add_column :identities, :expires_at, :integer
  end
end
