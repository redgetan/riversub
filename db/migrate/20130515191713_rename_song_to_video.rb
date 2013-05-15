class RenameSongToVideo < ActiveRecord::Migration
  
  def change
    rename_table(:songs,:videos)
    rename_column(:media_sources,:song_id,:video_id)
    rename_column(:timings,:song_id,:video_id)
  end

end
