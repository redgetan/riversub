class AddOriginalTextToCorrectionRequest < ActiveRecord::Migration
  def change
    add_column :correction_requests, :original_text, :text
  end
end
