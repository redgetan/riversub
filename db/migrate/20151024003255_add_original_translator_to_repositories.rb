class AddOriginalTranslatorToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :original_translator, :string 
  end
end
