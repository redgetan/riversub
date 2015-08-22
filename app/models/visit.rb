class Visit < ActiveRecord::Base
  has_many :ahoy_events, class_name: "Ahoy::Event"
  belongs_to :user
end

Ahoy.geocode = :async

module Ahoy
  module Stores
    class BaseStore
      def geocode(visit)
        if Ahoy.geocode == :async
          Delayed::Job.enqueue Ahoy::GeocodeDelayedJob.new(visit)
        end
      end
    end
  end
end

module Ahoy
  class GeocodeDelayedJob 

    def initialize(visit)
      @visit = visit  
    end

    def perform
      deckhand = Deckhands::LocationDeckhand.new(@visit.ip)
      Ahoy::VisitProperties::LOCATION_KEYS.each do |key|
        @visit.send(:"#{key}=", deckhand.send(key)) if @visit.respond_to?(:"#{key}=")
      end
      @visit.save!
    end

  end
end
