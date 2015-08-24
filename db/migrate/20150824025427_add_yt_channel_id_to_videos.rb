class AddYtChannelIdToVideos < ActiveRecord::Migration
  def change
    add_column :videos, :yt_channel_id, :string
  end
end
