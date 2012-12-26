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
    :host => "vhatch"
  }
}

set :application, "lyrex"
set :repository,  "git@bitbucket.org:redgetan/lyrex.git"
set :branch, "master"
set :scm, :git
set :scm_username, "redgetan"

set :use_sudo, false

set :deploy_environment, :staging

set :user, myconfig[deploy_environment][:user]
set :deploy_to, "/home/hatch/apps/lyrex"
set :deploy_via, :remote_cache

default_run_options[:pty] = true
ssh_options[:forward_agent] = true


host = myconfig[deploy_environment][:host]
role :web, host                          # Your HTTP server, Apache/etc
role :app, host                          # This may be the same as your `Web` server
role :db,  host, :primary => true # This is where Rails migrations will run

before "deploy:update" do
  run "ssh-add ~/.ssh/id_dsa"
end

after "deploy:restart", "deploy:cleanup" # keep only the last 5 releases
after "deploy:update_code", "deploy:migrate"

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
    run "cd #{current_path} && RAILS_ENV=production rake db:create"
  end
  after "deploy:setup", "deploy:setup_database"

  desc "Make sure local git is in sync with remote."
  task :check_revision, roles: :web do
    unless `git rev-parse HEAD` == `git rev-parse origin/master`
      puts "WARNING: HEAD is not the same as origin/master"
      puts "Run `git push` to sync changes."
      exit
    end
  end
  before "deploy", "deploy:check_revision"
end
