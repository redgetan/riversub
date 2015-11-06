class AddPlayEndToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :play_end, :integer
  end
end
