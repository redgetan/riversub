class CreateIdentities < ActiveRecord::Migration
  def change
    create_table :identities do |t|
      t.string :uid
      t.string :provider
      t.integer :user_id, :null => false

      t.timestamps
    end

  end
end
