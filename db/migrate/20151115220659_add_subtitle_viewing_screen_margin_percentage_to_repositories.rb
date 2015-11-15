class AddSubtitleViewingScreenMarginPercentageToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :subtitle_position, :float
  end
end
