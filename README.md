Installation
====

  We will be setting up Rails 3 project with all the required dependencies on
  a VM using vagrant.

  Make sure vagrant is installed. http://vagrantup.com/v1/docs/getting-started/index.html contains installation instructions. After vagrant is installed. We will add an Ubuntu 10.04 32 bit VM box.

    $ vagrant box add lucid32 http://files.vagrantup.com/lucid32.box

  Afterwards, we are ready to clone the rails_app repo

    $ git clone git@bitbucket.org:redgetan/river.git
    $ cd river
    $ vagrant up

  This will create a VM specifically for river.
  Now download chef_repo which contains the recipes that will make our VM fully configured for our rails app

    $ cd ~/
    $ git clone git@bitbucket.org:redgetan/chef_repo_river.git

  Now make sure your ssh config file contains the configuration shown below. If not, copy and paste it into your ~/.ssh/config file.

    $ cat ~/.ssh/config

    Host vm
      HostName 127.0.0.1
      User vagrant
      Port 2222
      UserKnownHostsFile /dev/null
      StrictHostKeyChecking no
      PasswordAuthentication no
      IdentityFile ~/.vagrant.d/insecure_private_key
      IdentitiesOnly yes

  Now you're ready to apply the chef_repo_river recipe to the VM. Do

    $ cd chef_repo_river
    $ ./deploy.sh vm

  Convert to HTTPS instead of ssh (too much hassle, has to add ssh pub key of each user to repo,then need to configure agentforwarding, ssh-add stuff)

  If everything goes well, your rails project is now fully setup in the VM. All you need to do is ssh into it and go to /vagrant directory where the rails project is located at.

    $ ssh default

  Once you're logged in

    $ cd /vagrant

  /vagrant is where your rails app is located in the VM. Since it's a shared folder, modifications on either the VM or localhost is reflected on either side immediately.

  To install the gems

    $ bundle install

  To setup database and tables

    $ rake db:create && rake db:migrate

  To run rails

    $ rails s

  Since port 3000 in VM is forwarded to port 3030 in localhost, you can access the rails app in your browser by going to:

    http://localhost:3030

Port Forwarding
====
  4 ports are forwarded from VM to localhost as configured in VagrantFile

    VM   => localhost
    22 => 2222           # ssh
    80 => 8080           # webserver
    3000 => 3030         # rails
    3306 => 4040         # mysql server

  This means,to access:
    rails app server, you go to http://localhost:3030 in your browser.
    mysql server, you connect to 127.0.0.1 port 4040

Deployment
====

  To see deployment configurations, look at config/deploy.rb

  Deploying to staging, first time:

    $ RAILS_ENV=staging bundle exec cap deploy:setup
    $ RAILS_ENV=staging bundle exec cap deploy

  Deploying to staging, after first time, for updates:

    $ RAILS_ENV=staging bundle exec cap deploy

  For production, simply change to RAILS_ENV=production

Testing
====

  $ rake db:test:prepare
  $ rspec

Dependencies
====

  popcorn.js version e72c1676d82c1e47be0a5723492dd65750c7bde0

