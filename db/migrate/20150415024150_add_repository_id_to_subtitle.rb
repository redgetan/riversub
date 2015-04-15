class AddRepositoryIdToSubtitle < ActiveRecord::Migration
  def change
    add_column :subtitles, :repository_id, :integer
    add_index :subtitles, :repository_id
  end
end
