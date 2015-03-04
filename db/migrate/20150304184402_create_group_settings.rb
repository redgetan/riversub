class CreateGroupSettings < ActiveRecord::Migration
  def change
    create_table :group_settings do |t|
      t.integer :group_id
      t.string :key
      t.text :value
    end
  end
end
