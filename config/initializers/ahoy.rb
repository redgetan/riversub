class Ahoy::Store < Ahoy::Stores::ActiveRecordStore
  # customize here
end

module Ahoy
  class Tracker

    FRESH_VISIT_DURATION = Rails.env.production? ? 4.hours : 1.seconds

    def new_visit?
      !current_page_recently_visited?(request.ip)
    end

    def visit_id
      # override original method so that we no longer look at cookie. always new visit id
      ensure_uuid(generate_id)
    end

    def current_page_recently_visited?(ip_address)
      Visit.where(landing_page: request_absolute_url)
           .where(ip: ip_address)
           .where("started_at > ?", Time.now.utc - FRESH_VISIT_DURATION).count > 0
    end

    def request_absolute_url
      [request.protocol, request.host_with_port, request.fullpath].join
    end

  end
end


