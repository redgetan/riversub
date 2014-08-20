class AddParentTextToSubtitle < ActiveRecord::Migration
  def change
    add_column :subtitles, :parent_text, :string
  end
end
