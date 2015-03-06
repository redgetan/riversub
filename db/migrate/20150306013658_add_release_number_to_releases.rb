class AddReleaseNumberToReleases < ActiveRecord::Migration
  def change
    add_column :releases, :release_number, :integer, :null => false
  end
end
