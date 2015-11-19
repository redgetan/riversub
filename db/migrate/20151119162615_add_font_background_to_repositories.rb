class AddFontBackgroundToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :font_background, :string
  end
end
