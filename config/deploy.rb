require 'bundler/capistrano'
require 'rvm/capistrano'

set :rvm_ruby_string, ENV['GEM_HOME'].gsub(/.*\//,"")
set :rvm_type, :system

set :myconfig, {
  :production => {
    :user => "hatch",
    :host => "www.zeroplay.net"
  },
  :staging => {
    :user => "hatch",
    :host => "localhost"
  }
}

set :application, "river"
set :repository,  "git@bitbucket.org:redgetan/river.git"
set :branch, "master"
set :scm, :git
set :scm_username, "redgetan"

set :use_sudo, false


set :deploy_environment, ENV['RAILS_ENV'].to_sym

if ![:staging, :production].include?(deploy_environment)
  puts "Usage: "
  puts "  RAILS_ENV=production cap deploy:setup"
  puts "  RAILS_ENV=staging    cap deploy:setup"
  exit
end

set :user, myconfig[deploy_environment][:user]
set :deploy_to, "/home/hatch/apps/river"
set :deploy_via, :remote_cache

default_run_options[:pty] = true
ssh_options[:forward_agent] = true


host = myconfig[deploy_environment][:host]
role :web, host                          # Your HTTP server, Apache/etc
role :app, host                          # This may be the same as your `Web` server
role :db,  host, :primary => true # This is where Rails migrations will run

after "deploy:restart", "deploy:cleanup" # keep only the last 5 releases
after "deploy:update_code", "deploy:setup_database"
after "deploy:setup_database", "deploy:migrate"

namespace :deploy do
  %w[start stop reload upgrade].each do |command|
    desc "#{command} unicorn server"
    task command, roles: :app, except: {no_release: true} do
      run "/etc/init.d/unicorn_#{application} #{command}"
    end
  end

  task :setup_config, roles: :app do
    sudo "ln -nfs #{current_path}/config/unicorn_init.sh /etc/init.d/unicorn_#{application}"
  end
  after "deploy:setup", "deploy:setup_config"

  task :setup_database, roles: :app do
    run "cd #{release_path} && RAILS_ENV=production rake db:create"
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
