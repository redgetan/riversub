class AddIsProducerToUsers < ActiveRecord::Migration
  def change
    add_column :users, :is_producer, :boolean
  end
end
