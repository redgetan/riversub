class RemoveSongIdColumnFromSubtitles < ActiveRecord::Migration

  def up
    remove_column(:subtitles,:song_id)
  end

  def down
    add_column(:subtitles,:song_id, :integer)
  end
end
