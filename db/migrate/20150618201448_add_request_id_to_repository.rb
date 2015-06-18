class AddRequestIdToRepository < ActiveRecord::Migration
  def change
    add_column :repositories, :request_id, :integer
  end
end
