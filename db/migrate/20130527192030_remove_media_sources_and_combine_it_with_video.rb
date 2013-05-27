class RemoveMediaSourcesAndCombineItWithVideo < ActiveRecord::Migration
  def up
    drop_table :media_sources
    add_column :videos, :url, :string
  end

  def down
    remove_column :videos, :url

    create_table :media_sources do |t|

      t.integer :song_id, :null => false

      t.string :media_type
      t.string :url
      t.integer :votes

      t.timestamps
    end

  end
end
