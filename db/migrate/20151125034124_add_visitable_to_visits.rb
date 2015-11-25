class AddVisitableToVisits < ActiveRecord::Migration
  def change
    add_column :visits, :visitable_id, :integer
    add_column :visits, :visitable_type, :string
  end
end
