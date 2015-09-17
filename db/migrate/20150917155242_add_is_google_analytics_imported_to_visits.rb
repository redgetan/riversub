class AddIsGoogleAnalyticsImportedToVisits < ActiveRecord::Migration
  def change
    add_column :visits, :is_google_analytics_imported, :boolean
  end
end
