class AddDetailsToRequest < ActiveRecord::Migration
  def change
    add_column :requests, :details, :text
  end
end
