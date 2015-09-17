gem 'legato'

module Yasub
  class Importer
    def import!(options = {})
      client = Yasub::Analytics.new  
      result = client.overall_traffic

      Repository.published.find_each(batch_size: 1000) do |repo|
        total_view_count   = result[repo.relative_url].try(:[],:pageviews).to_i
        current_view_count = repo.views_contributed
        missing_view_count = total_view_count - current_view_count

        STDOUT.puts("#{repo.relative_url}\t total: #{total_view_count},\t current_view_count: #{current_view_count}" )

        if !options[:pretend] && missing_view_count > 0
          missing_view_count.times do
            v = Visit.new
            v.id = Ahoy::Tracker.new.visit_id
            v.landing_page = repo.url
            v.started_at = Date.today - 1.day
            v.is_google_analytics_imported = true
            v.save!
          end
        end
      end
    end
  end

  class Analytics

    YASUB_GOOGLE_API_P12_KEY = ENV["YASUB_GOOGLE_API_P12_KEY"]
    YASUB_GOOGLE_SERVICE_ACCOUNT_EMAIL = "451571491990-5lb7u9biml8gv3oe2oj551hogipqvtap@developer.gserviceaccount.com"

    def date_filter
      { start_date: Date.today - 5.years, end_date: Date.today }
    end

    def overall_traffic
      result = OverallTraffic.results(profile, date_filter)
      result = result.for_repo_pages
      legato_query_to_hash(result)
    end

    def legato_query_to_hash(legato_query)
      dimension_names = dimension_names(legato_query)
      metric_names = metric_names(legato_query)

      legato_query.inject({}) do |result,item|
        dimension_names.each do |dimension_name|
          dimension = item.send(dimension_name)
          result[dimension] = build_metrics_hash(metric_names, item)
        end
        result
      end
    end

    def dimension_names(legato_query)
      legato_query.dimensions.elements.map { |elem| elem.to_s.camelize(:lower) }
    end

    def metric_names(legato_query)
      legato_query.metrics.elements
    end

    def build_metrics_hash(metric_names, item)
      metric_names.inject({}) do |result, metric_name|
        result[metric_name] = item.send(metric_name)
        result
      end
    end

    def profile
      user.accounts.first.profiles.first
    end

    def user
      return @_user if @_user && !@_user.access_token.expired?
      @_user = get_legato_user
    end

    # https://github.com/tpitale/legato/wiki/OAuth2-and-Google#service-accounts
    # OAuth 2.0 token granted via "Client Credentials Grant", in which the client is also the resource owner
    # see RFC 6749 section 4.4 for details (https://tools.ietf.org/html/rfc6749#section-4.4)
    def get_legato_user(scope="https://www.googleapis.com/auth/analytics.readonly")
      key = Google::APIClient::PKCS12.load_key(YASUB_GOOGLE_API_P12_KEY, "notasecret")
      service_account = Google::APIClient::JWTAsserter.new(YASUB_GOOGLE_SERVICE_ACCOUNT_EMAIL, scope, key)
      result = service_account.authorize # network request to Google's OAuth Auth Server
      oauth2_access_token = get_oauth2_access_token(result.access_token)
      Legato::User.new(oauth2_access_token)
    end

    private

      # Doesnt actually request access token. Rather it simply converts
      # an access token string to an OAuth2::AccessToken instance
      # Legato's API can only work with OAuth2::AccessToken
      def get_oauth2_access_token(access_token_string)
        oauth_client = OAuth2::Client.new("", "", {
          :authorize_url => 'https://accounts.google.com/o/oauth2/auth',
          :token_url => 'https://accounts.google.com/o/oauth2/token',
        })
        # you cant set the expiry to more than an hour, this simply tells us
        # when we need to request the access token again
        one_hour_expiry = 1 * 60 * 60
        token = OAuth2::AccessToken.new(oauth_client, access_token_string, expires_in: one_hour_expiry)
      end

  end

  class OverallTraffic
    extend Legato::Model

    filter(:for_repo_pages) { contains(:pagepath, "^/r/[^/]*$") }

    metrics :pageviews
    dimensions :pagepath
  end

end

