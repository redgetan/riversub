class AddTokenToSubtitles < ActiveRecord::Migration
  def change
    add_column :subtitles, :token, :string
  end
end
