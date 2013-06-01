class ChangeTimingsColumnFromVideoIdToRepositoryId < ActiveRecord::Migration
  def up
    rename_column :timings, :video_id, :repository_id
  end

  def down
    rename_column :timings, :repository_id, :video_id
  end
end
