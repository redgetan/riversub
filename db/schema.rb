# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20121029160734) do

  create_table "media_sources", :force => true do |t|
    t.integer  "song_id",    :null => false
    t.string   "media_type"
    t.string   "url"
    t.integer  "votes"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "media_sources", ["song_id"], :name => "media_sources_song_id_fk"

  create_table "songs", :force => true do |t|
    t.string   "name"
    t.string   "artist"
    t.string   "genre"
    t.text     "lyrics"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "sync_files", :force => true do |t|
    t.integer  "song_id",    :null => false
    t.text     "timecode"
    t.integer  "votes"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "sync_files", ["song_id"], :name => "sync_files_song_id_fk"

  add_foreign_key "media_sources", "songs", :name => "media_sources_song_id_fk"

  add_foreign_key "sync_files", "songs", :name => "sync_files_song_id_fk"

end
