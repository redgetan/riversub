class CreateSubtitles < ActiveRecord::Migration
  def change
    create_table :subtitles do |t|

      t.integer :song_id, :null => false

      t.string :text
      t.integer :order

      t.timestamps
    end
    
  end
end
