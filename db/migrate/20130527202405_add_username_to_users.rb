class AddUsernameToUsers < ActiveRecord::Migration
  def up
    add_column :users, :username, :string, :unique => true
  end

  def down
    remove_column :users, :username
  end
end
