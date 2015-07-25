class CreatePages < ActiveRecord::Migration
  def change
    create_table :pages do |t|
      t.string  :short_name
      t.text    :metadata
      t.integer :identity_id
      t.timestamps
    end

    add_index :pages, :identity_id
  end
end
