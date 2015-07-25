class AddYtChannelIdToIdentities < ActiveRecord::Migration
  def change
    add_column :identities, :yt_channel_id, :string
  end
end
