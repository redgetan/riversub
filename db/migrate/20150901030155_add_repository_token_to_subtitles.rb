class AddRepositoryTokenToSubtitles < ActiveRecord::Migration
  def change
    add_column :subtitles, :repository_token, :string
  end
end
