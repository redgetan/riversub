class AddIsTranslatorForceToUsers < ActiveRecord::Migration
  def up
    unless User.column_names.include?("is_translator")
      add_column :users, :is_translator, :boolean
    end
  end

  def down
    remove_column :users, :is_translator
  end
end
