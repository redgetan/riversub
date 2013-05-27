class RemoveMediaSourcesAndCombineItWithVideo < ActiveRecord::Migration
  def up
    add_column :videos, :url, :string

    update "UPDATE videos,media_sources SET videos.url = media_sources.url WHERE videos.id = media_sources.video_id"

    drop_table :media_sources
  end

  def down
    create_table :media_sources do |t|

      t.integer :video_id, :null => false

      t.string :media_type
      t.string :url
      t.integer :votes

      t.timestamps
    end

    Video.all.each do |v|
      ActiveRecord::Base.connection.execute "INSERT INTO media_sources (video_id,url) VALUES ('#{v.id}','#{v.url}')"
    end

    remove_column :videos, :url

  end
end
