class Subtitle < ActiveRecord::Base
  attr_accessible :text

  has_one    :timing

  def serialize
    {
      :id => self.id,
      :text => self.text,
    }
  end

end
