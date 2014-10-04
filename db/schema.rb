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

ActiveRecord::Schema.define(:version => 20141005013208) do

  create_table "conversations", :force => true do |t|
    t.string   "subject",    :default => ""
    t.datetime "created_at",                 :null => false
    t.datetime "updated_at",                 :null => false
  end

  create_table "group_repositories", :force => true do |t|
    t.integer  "group_id"
    t.integer  "repository_id"
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
  end

  create_table "groups", :force => true do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
    t.integer  "creator_id"
  end

  create_table "identities", :force => true do |t|
    t.string   "uid"
    t.string   "provider"
    t.integer  "user_id",    :null => false
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "memberships", :force => true do |t|
    t.integer  "group_id"
    t.integer  "user_id"
    t.boolean  "is_owner",   :default => false
    t.datetime "created_at",                    :null => false
    t.datetime "updated_at",                    :null => false
  end

  create_table "notifications", :force => true do |t|
    t.string   "type"
    t.text     "body"
    t.string   "subject",              :default => ""
    t.integer  "sender_id"
    t.string   "sender_type"
    t.integer  "conversation_id"
    t.boolean  "draft",                :default => false
    t.datetime "updated_at",                              :null => false
    t.datetime "created_at",                              :null => false
    t.integer  "notified_object_id"
    t.string   "notified_object_type"
    t.string   "notification_code"
    t.string   "attachment"
    t.boolean  "global",               :default => false
    t.datetime "expires"
  end

  add_index "notifications", ["conversation_id"], :name => "index_notifications_on_conversation_id"

  create_table "receipts", :force => true do |t|
    t.integer  "receiver_id"
    t.string   "receiver_type"
    t.integer  "notification_id",                                  :null => false
    t.boolean  "is_read",                       :default => false
    t.boolean  "trashed",                       :default => false
    t.boolean  "deleted",                       :default => false
    t.string   "mailbox_type",    :limit => 25
    t.datetime "created_at",                                       :null => false
    t.datetime "updated_at",                                       :null => false
  end

  add_index "receipts", ["notification_id"], :name => "index_receipts_on_notification_id"

  create_table "repositories", :force => true do |t|
    t.integer  "video_id",             :null => false
    t.integer  "user_id"
    t.datetime "created_at",           :null => false
    t.datetime "updated_at",           :null => false
    t.string   "token"
    t.boolean  "is_published"
    t.string   "language"
    t.integer  "parent_repository_id"
  end

  create_table "settings", :force => true do |t|
    t.string "key"
    t.string "value"
  end

  create_table "subtitle_requests", :force => true do |t|
    t.integer  "video_id",                                    :null => false
    t.integer  "user_id",                                     :null => false
    t.string   "from_language"
    t.string   "to_language"
    t.decimal  "price",         :precision => 8, :scale => 2
    t.string   "status"
    t.datetime "created_at",                                  :null => false
    t.datetime "updated_at",                                  :null => false
  end

  create_table "subtitles", :force => true do |t|
    t.string   "text"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
    t.string   "parent_text"
  end

  create_table "timings", :force => true do |t|
    t.integer  "repository_id", :null => false
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
    t.float    "start_time"
    t.float    "end_time"
    t.integer  "subtitle_id"
  end

  create_table "translations", :force => true do |t|
    t.integer  "subtitle_id", :null => false
    t.string   "language"
    t.text     "text"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
  end

  create_table "users", :force => true do |t|
    t.string   "email",                  :default => "",    :null => false
    t.string   "encrypted_password",     :default => "",    :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at",                                :null => false
    t.datetime "updated_at",                                :null => false
    t.string   "username"
    t.string   "avatar"
    t.text     "bio"
    t.boolean  "is_admin",               :default => false
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

  create_table "videos", :force => true do |t|
    t.string   "name"
    t.string   "artist"
    t.string   "genre"
    t.text     "lyrics"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.text     "metadata"
    t.string   "url"
    t.string   "token"
  end

end
