class CreateUserSettings < ActiveRecord::Migration
  def change
    create_table :user_settings do |t|
      t.integer :user_id
      t.string :key
      t.text :value
      t.timestamps
    end

    add_index :user_settings, :user_id
  end
end
