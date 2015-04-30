class AddIsYoutubeSyncEmailSentToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :youtube_sync_email_sent_to, :string
  end
end
