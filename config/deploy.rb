require 'bundler/capistrano'
require 'rvm/capistrano'
require "delayed/recipes"  

set :rvm_ruby_string, ENV['GEM_HOME'].gsub(/.*\//,"")
set :rvm_type, :system

set :myconfig, {
  :production => {
    :user => "hatch",
    :host => "162.243.222.38"
  },
  :staging => {
    :user => "hatch",
    :host => "stage"
  }
}

set :application, "river"
set :repository,  "git@bitbucket.org:redgetan/river.git"
set :branch, "master"
set :scm, :git
set :scm_username, "redgetan"

set :use_sudo, false


set :deploy_environment, ENV['RAILS_ENV'] ? ENV['RAILS_ENV'].to_sym : nil
set :rails_env, ENV['RAILS_ENV'] ? ENV['RAILS_ENV'].to_sym : nil

if !deploy_environment || ![:staging, :production].include?(deploy_environment)
  puts "Usage: "
  puts "  RAILS_ENV=production cap deploy:setup"
  puts "  RAILS_ENV=staging    cap deploy:setup"
  exit
end

set :user, myconfig[deploy_environment][:user]
set :deploy_to, "/home/hatch/apps/river"
set :deploy_via, :remote_cache

# http://stackoverflow.com/questions/9043662/carrierwave-files-with-capistrano/9710542#9710542
set :shared_children, shared_children + %w{public/uploads public/downloads}

default_run_options[:pty] = true
ssh_options[:forward_agent] = true


host = myconfig[deploy_environment][:host]
role :web, host                          # Your HTTP server, Apache/etc
role :app, host                          # This may be the same as your `Web` server
role :db,  host, :primary => true # This is where Rails migrations will run

after "deploy:setup", "deploy:create_shared_uploads_folder"
after "deploy:setup", "deploy:create_shared_downloads_folder"

after "deploy:restart", "deploy:cleanup" # keep only the last 5 releases
after "deploy:restart", "deploy:reload" # unicorn pre init app true uses reload instead of restart

after "deploy:update_code", "deploy:setup_database"
after "deploy:setup_database", "deploy:migrate_environment_aware"
after "deploy:create_symlink", "deploy:update_unicorn_init_script"

after "deploy:stop",    "delayed_job:stop"
after "deploy:start",   "delayed_job:start"
after "deploy:restart", "delayed_job:restart"

namespace :deploy do
  %w[start stop reload upgrade].each do |command|
    desc "#{command} unicorn server"
    task command, roles: :app, except: {no_release: true} do
      run "/etc/init.d/unicorn_#{application} #{command}"
    end
  end

  desc "create shared/uploads folder"
  task :create_shared_uploads_folder, :except => { :no_release => true } do
    run "mkdir -p #{shared_path}/uploads"
  end

  desc "create shared/downloads folder"
  task :create_shared_downloads_folder, :except => { :no_release => true } do
    run "mkdir -p #{shared_path}/downloads"
  end

  task :update_unicorn_init_script, roles: :app do
    sudo "ln -nfs #{current_path}/config/unicorn_init_#{deploy_environment}.sh /etc/init.d/unicorn_#{application}"
  end

  task :setup_database, roles: :app do
    run "cd #{release_path} && RAILS_ENV=#{deploy_environment} rake db:create"
  end

  task :migrate_environment_aware, roles: :app do
    run "cd #{release_path} && RAILS_ENV=#{deploy_environment} rake db:migrate"
  end

  desc "Make sure local git is in sync with remote."
  task :check_revision, roles: :web do
    unless `git rev-parse HEAD` == `git rev-parse origin/master`
      puts "WARNING: HEAD is not the same as origin/master"
      puts "Run `git push` to sync changes."
      exit
    end
  end

  task :add_ssh_keys_to_agent, roles: :web do
    `ssh-add ~/.ssh/id_rsa`
  end

  before "deploy", "deploy:check_revision"
  before "deploy", "deploy:add_ssh_keys_to_agent"
end
