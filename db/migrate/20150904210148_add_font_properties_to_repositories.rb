class AddFontPropertiesToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :font_family, :string
    add_column :repositories, :font_size, :string
    add_column :repositories, :font_weight, :string
    add_column :repositories, :font_style, :string
    add_column :repositories, :font_color, :string
    add_column :repositories, :font_outline_color, :string
  end
end
