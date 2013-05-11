class RemoveOrderColumnFromSubtitles < ActiveRecord::Migration
  def up
    remove_column(:subtitles,:order)
  end

  def down
    add_column(:subtitles,:order,:integer)
  end
end
