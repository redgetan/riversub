class CreateMediaSources < ActiveRecord::Migration
  def change
    create_table :media_sources do |t|

      t.integer :song_id, :null => false

      t.string :media_type
      t.string :url
      t.integer :votes

      t.timestamps
    end

    add_foreign_key(:media_sources, :songs)
  end
end
