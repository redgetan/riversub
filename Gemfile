source 'https://rubygems.org'

gem 'rails', '3.2.11'

# Bundle edge Rails instead:
# gem 'rails', :git => 'git://github.com/rails/rails.git'

gem 'mysql2'


# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'

  # See https://github.com/sstephenson/execjs#readme for more supported runtimes
  gem 'libv8', '~> 3.11.8'
  gem 'therubyracer'

  gem 'uglifier', '>= 1.0.3'
end

gem 'jquery-rails'

group :development, :test do
  gem 'thin'
  gem 'capistrano',
    :git => 'git://github.com/capistrano/capistrano.git',
    :ref => "186b698eebc8b3ea3d67abb5a141bada1c595cc9"
  gem 'capistrano-unicorn', :require => false
  gem 'rvm-capistrano'
  gem "pry"
  gem 'pry-stack_explorer'
  gem 'rspec'
  gem 'rspec-rails'
  gem 'debugger'
  gem 'factory_girl'
end

# To use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

# To use Jbuilder templates for JSON
# gem 'jbuilder'

gem 'unicorn'
gem 'devise'
