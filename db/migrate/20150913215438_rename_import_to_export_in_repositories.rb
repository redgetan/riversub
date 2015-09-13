class RenameImportToExportInRepositories < ActiveRecord::Migration
  def change
    rename_column :repositories, :is_youtube_imported, :is_youtube_exported
  end
end
