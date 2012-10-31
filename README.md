Installation
====

  Make sure the following are installed

  1. rvm
  2. ruby-1.9.3-p194
  3. mysql

  User Configuration

  1. Add user "lyrex" to mysql with settings similar to one specified in config/database.yml

  After they have been installed, do this

    $ rvm use ruby-1.9.3-p194 && rvm gemset create lyrex
    $ git clone git@bitbucket.org:redgetan/lyrex.git
    $ cd lyrex
    $ bundle install
    $ rake db:create
    $ rake db:migrate
    $ rake db:seed

Usage
====

    $ rails s
