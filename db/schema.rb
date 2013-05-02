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

ActiveRecord::Schema.define(:version => 20130501212433) do

  create_table "media_sources", :force => true do |t|
    t.integer  "song_id",    :null => false
    t.string   "media_type"
    t.string   "url"
    t.integer  "votes"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "songs", :force => true do |t|
    t.string   "name"
    t.string   "artist"
    t.string   "genre"
    t.text     "lyrics"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.text     "metadata"
  end

  create_table "subtitles", :force => true do |t|
    t.integer  "song_id",    :null => false
    t.string   "text"
    t.integer  "order"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "timings", :force => true do |t|
    t.integer  "song_id",     :null => false
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
    t.float    "start_time"
    t.float    "end_time"
    t.integer  "subtitle_id"
  end

  create_table "users", :force => true do |t|
    t.string   "email",                  :default => "", :null => false
    t.string   "encrypted_password",     :default => "", :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at",                             :null => false
    t.datetime "updated_at",                             :null => false
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

end
