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

ActiveRecord::Schema.define(:version => 20150430025150) do

  create_table "activities", :force => true do |t|
    t.integer  "trackable_id"
    t.string   "trackable_type"
    t.integer  "owner_id"
    t.string   "owner_type"
    t.string   "key"
    t.text     "parameters"
    t.integer  "recipient_id"
    t.string   "recipient_type"
    t.datetime "created_at",     :null => false
    t.datetime "updated_at",     :null => false
  end

  add_index "activities", ["owner_id", "owner_type"], :name => "index_activities_on_owner_id_and_owner_type"
  add_index "activities", ["recipient_id", "recipient_type"], :name => "index_activities_on_recipient_id_and_recipient_type"
  add_index "activities", ["trackable_id", "trackable_type"], :name => "index_activities_on_trackable_id_and_trackable_type"

  create_table "comments", :force => true do |t|
    t.integer  "commentable_id",                                     :default => 0
    t.string   "commentable_type"
    t.string   "title"
    t.text     "body"
    t.string   "subject"
    t.integer  "user_id",                                            :default => 0,     :null => false
    t.integer  "parent_comment_id"
    t.integer  "lft"
    t.integer  "rgt"
    t.datetime "created_at",                                                            :null => false
    t.datetime "updated_at",                                                            :null => false
    t.boolean  "is_deleted",                                         :default => false
    t.decimal  "confidence",         :precision => 20, :scale => 19, :default => 0.0,   :null => false
    t.string   "short_id"
    t.boolean  "is_moderated",                                       :default => false
    t.text     "markeddown_comment"
  end

  add_index "comments", ["commentable_id", "commentable_type"], :name => "index_comments_on_commentable_id_and_commentable_type"
  add_index "comments", ["user_id"], :name => "index_comments_on_user_id"

  create_table "group_settings", :force => true do |t|
    t.integer "group_id"
    t.string  "key"
    t.text    "value"
  end

  create_table "groups", :force => true do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
    t.integer  "creator_id"
    t.string   "short_name",  :null => false
    t.string   "title"
  end

  add_index "groups", ["short_name"], :name => "index_groups_on_short_name", :unique => true

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

  create_table "release_items", :force => true do |t|
    t.integer  "release_id"
    t.integer  "position"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "releases", :force => true do |t|
    t.datetime "date"
    t.boolean  "is_published"
    t.datetime "created_at",     :null => false
    t.datetime "updated_at",     :null => false
    t.integer  "group_id"
    t.integer  "release_number", :null => false
  end

  create_table "repositories", :force => true do |t|
    t.integer  "video_id",                                      :null => false
    t.integer  "user_id"
    t.datetime "created_at",                                    :null => false
    t.datetime "updated_at",                                    :null => false
    t.string   "token"
    t.boolean  "is_published"
    t.string   "language"
    t.integer  "parent_repository_id"
    t.boolean  "is_youtube_imported",        :default => false
    t.boolean  "is_template",                :default => false
    t.string   "title"
    t.integer  "group_id"
    t.integer  "release_item_id"
    t.string   "youtube_sync_email_sent_to"
  end

  create_table "settings", :force => true do |t|
    t.string "key"
    t.string "value"
  end

  create_table "subtitles", :force => true do |t|
    t.string   "text"
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
    t.string   "parent_text"
    t.string   "token"
    t.integer  "repository_id"
  end

  add_index "subtitles", ["repository_id"], :name => "index_subtitles_on_repository_id"

  create_table "timings", :force => true do |t|
    t.integer  "repository_id", :null => false
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
    t.float    "start_time"
    t.float    "end_time"
    t.integer  "subtitle_id"
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
    t.boolean  "is_super_admin",         :default => false
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true
  add_index "users", ["username"], :name => "index_users_on_username", :unique => true

  create_table "versions", :force => true do |t|
    t.string   "item_type",  :null => false
    t.integer  "item_id",    :null => false
    t.string   "event",      :null => false
    t.string   "whodunnit"
    t.text     "object"
    t.datetime "created_at"
  end

  add_index "versions", ["item_type", "item_id"], :name => "index_versions_on_item_type_and_item_id"

  create_table "videos", :force => true do |t|
    t.string   "name"
    t.string   "artist"
    t.string   "genre"
    t.text     "lyrics"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.text     "metadata"
    t.string   "token"
    t.string   "language"
    t.string   "source_url"
  end

  create_table "votes", :force => true do |t|
    t.integer  "votable_id"
    t.string   "votable_type"
    t.integer  "voter_id"
    t.string   "voter_type"
    t.boolean  "vote_flag"
    t.string   "vote_scope"
    t.integer  "vote_weight"
    t.datetime "created_at",   :null => false
    t.datetime "updated_at",   :null => false
  end

  add_index "votes", ["votable_id", "votable_type", "vote_scope"], :name => "index_votes_on_votable_id_and_votable_type_and_vote_scope"
  add_index "votes", ["votable_id", "votable_type"], :name => "index_votes_on_votable_id_and_votable_type"
  add_index "votes", ["voter_id", "voter_type", "vote_scope"], :name => "index_votes_on_voter_id_and_voter_type_and_vote_scope"
  add_index "votes", ["voter_id", "voter_type"], :name => "index_votes_on_voter_id_and_voter_type"

end
