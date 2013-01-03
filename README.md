Installation
====

  We will be setting up Rails 3 project with all the required dependencies on
  a VM using vagrant.

  Make sure vagrant is installed. http://vagrantup.com/v1/docs/getting-started/index.html contains installation instructions. After vagrant is installed. We will add an Ubuntu 10.04 32 bit VM box.

    $ vagrant box add lucid32 http://files.vagrantup.com/lucid32.box

  Afterwards, we are ready to clone the rails_app repo

    $ cd ~/
    $ git clone git@bitbucket.org:redgetan/lyrex.git
    $ cd lyrex
    $ vagrant up

  This will create a VM specifically for lyrex.
  Now download chef-repo which contains the recipes that will make our VM fully configured for our rails app

    $ cd ~/
    $ git clone git@bitbucket.org:redgetan/chef-repo.git

  Now make sure your ssh config file contains the configuration shown below. If not, copy and paste it into your ~/.ssh/config file.

  NOTE that you have to change the location of the identity file according to where your vagrant's private_key is located at. Mine is located under /Users/reg/.vagrant.d but yours could be found on /Users/you/.vagrant.d

    $ cat ~/.ssh/config

    Host default
      HostName 127.0.0.1
      User vagrant
      Port 2222
      UserKnownHostsFile /dev/null
      StrictHostKeyChecking no
      PasswordAuthentication no
      IdentityFile /Users/reg/.vagrant.d/insecure_private_key
      IdentitiesOnly yes

  Now you're ready to apply the chef-repo recipe to the VM. Do

    $ cd chef-repo
    $ ./deploy default

  If everything goes well, your rails project is now fully setup in the VM. All you need to do is ssh into it and go to /vagrant directory where the rails project is located at.

    $ ssh default

  Once you're logged in

    $ cd /vagrant

  /vagrant is where your rails app is located in the VM. Since it's a shared folder, modifications on either the VM or localhost is reflected on either side immediately.

  To install the gems

    $ bundle install

  To setup database and tables

    $ rake db:create && rake db:migrate && rake db:seed

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

