class AddTokenToRepository < ActiveRecord::Migration
  def change
    add_column :repositories, :token, :string
  end
end
