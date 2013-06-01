class AddUrlTokenToVideo < ActiveRecord::Migration
  def change
    add_column :videos, :token, :string
  end
end
