River::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Log error messages when you accidentally call methods on nil.
  config.whiny_nils = true

  # Show full error reports and disable caching
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Print deprecation notices to the Rails logger
  config.active_support.deprecation = :log

  # Only use best-standards-support built into browsers
  config.action_dispatch.best_standards_support = :builtin

  # Raise exception on mass assignment protection for Active Record models
  config.active_record.mass_assignment_sanitizer = :strict

  # Log the query plan for queries taking more than this (works
  # with SQLite, MySQL, and PostgreSQL)
  config.active_record.auto_explain_threshold_in_seconds = 0.5

  # Do not compress assets
  config.assets.compress = false

  # Expands the lines which load the assets
  config.assets.debug = true

  # prevent assets from being cached
  config.assets.cache_store = :null_store

  config.action_mailer.default_url_options = { :host => 'dev.yasub.com:3000' }
  Rails.application.routes.default_url_options[:host] = 'dev.yasub.com:3000'

  load "#{Rails.root}/lib/object_extensions.rb"
  load "#{Rails.root}/lib/google_analytics_import.rb"

  config.action_mailer.default_url_options = { host: "http://dev.yasub.com:3000" }
  config.action_mailer.perform_deliveries = true
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = { :address => "localhost", :port => 1025 }
  config.action_mailer.raise_delivery_errors = false

  config.after_initialize do
    Bullet.enable = false
    Bullet.alert = true
    Bullet.bullet_logger = true
    Bullet.console = true
    Bullet.rails_logger = true
    Bullet.add_footer = true
    # Bullet.add_whitelist :type => :n_plus_one_query, :class_name => "Comment", :association => :commentable
  end

  # Mail::SMTP.class_eval do
  #   alias_method :orig_initialize, :initialize
  #   def initialize(values)
  #     orig_initialize(values)
  #     self.settings[:port] = 1025
  #   end
  # end

  # this is the cookie expiration time of visit. since we track immediately and ignore cookies, set this to a high value
  Ahoy.visit_duration = 24.hours
  Ahoy.track_visits_immediately = true

end

# http://stackoverflow.com/a/4531494
if ENV["RAILS_SQL_TRACE"].present?
  module QueryTrace
    def self.append_features(klass)
      super
      klass.class_eval do
        unless method_defined?(:log_info_without_trace)
          alias_method :log_info_without_trace, :sql
          alias_method :sql, :log_info_with_trace
        end
      end
    end

    def log_info_with_trace(event)
      log_info_without_trace(event)
      logger.debug("\e[1m\e[35m\e[1m\e[47mCalled from:\e[0m " + clean_trace(caller[2..-2]).join("\n "))
    end

    def clean_trace(trace)
      Rails.respond_to?(:backtrace_cleaner) ?
        Rails.backtrace_cleaner.clean(trace) :
        trace
    end
  end

  class ::ActiveRecord::LogSubscriber
    include QueryTrace
  end
end

# ENV['http_proxy'] = "http://localhost:8080"
# ENV['SSL_CERT_FILE'] = "/Users/reg/.mitmproxy/mitmproxy-ca-cert.pem"

# module Net
#   class HTTP
#     alias_method :orig_initialize, :initialize
#     def initialize(address, port = nil)
#       orig_initialize(address, port)
#       self.use_ssl = true
#       self.verify_mode = OpenSSL::SSL::VERIFY_PEER
#       self.ca_path = "/Users/reg/.mitmproxy"
#     end
#   end
# end

# RestClient.proxy = ENV['http_proxy']