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

# if you want to clean up old releases on each deploy uncomment this:
# after "deploy:restart", "deploy:cleanup"

# if you're still using the script/reaper helper you will need
# these http://github.com/rails/irs_process_scripts

# If you are using Passenger mod_rails uncomment this:
#namespace :deploy do
  #task :start do ; end
  #task :stop do ; end
  #task :restart, :roles => :app, :except => { :no_release => true } do
    #run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
  #end
#end

set :rails_env, deploy_environment
set :unicorn_binary, "#{shared_path}/bundle/ruby/1.9.1/gems/unicorn-4.5.0/bin/unicorn_rails"
set :unicorn_config, "#{current_path}/config/unicorn.rb"
set :unicorn_pid, "#{current_path}/tmp/pids/unicorn.pid"

namespace :deploy do
  task :start, :roles => :app, :except => { :no_release => true } do
    run "cd #{current_path} && #{try_sudo} #{unicorn_binary} -c #{unicorn_config} -E #{rails_env} -D"
  end
  task :stop, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} kill `cat #{unicorn_pid}`"
  end
  task :graceful_stop, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} kill -s QUIT `cat #{unicorn_pid}`"
  end
  task :reload, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} kill -s USR2 `cat #{unicorn_pid}`"
  end
  task :restart, :roles => :app, :except => { :no_release => true } do
    reload
  end
end

after "deploy", "deploy:cleanup" # keep only the last 5 releases
