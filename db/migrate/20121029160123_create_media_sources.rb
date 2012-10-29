class CreateMediaSources < ActiveRecord::Migration
  def change
    create_table :media_sources do |t|

      t.integer :song_id

      t.string :type
      t.string :url
      t.integer :rating

      t.timestamps
    end
    add_foreign_key(:media_sources, :songs)
  end
end
