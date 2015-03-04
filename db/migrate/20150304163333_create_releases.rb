class CreateReleases < ActiveRecord::Migration
  def change
    create_table :releases do |t|
      t.datetime :date
      t.boolean :is_published

      t.timestamps
    end
  end
end
