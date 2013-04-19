class Subtitle < ActiveRecord::Base
  attr_accessible :text, :order

  belongs_to :song

  validates :text, :order, :presence => true

  def serialize
    result = self.class.accessible_attributes.inject({}) do |result, attr|
      # rails 3.2.11, sometimes attr is blank
      unless attr == ""
        # to access client_id, you can't do self[client_id], but you can do self.client_id (its really a method, not an attribute)
        value = eval("self.#{attr}")
        result.merge!({ attr => value }) unless attr == ""
      end
      result
    end
    result.merge!({ :id => self.id})
  end

end
