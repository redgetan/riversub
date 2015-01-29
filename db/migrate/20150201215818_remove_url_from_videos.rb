class RemoveUrlFromVideos < ActiveRecord::Migration
  def up
    Video.all.each do |video|
      video.update_column(:source_url, video.url)
    end

    remove_column :videos, :url
  end

  def down
    add_column :videos, :url, :string

    Video.all.each do |video|
      video.update_column(:url, video.source_url)
    end
  end
end
