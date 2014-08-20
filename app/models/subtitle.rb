class Subtitle < ActiveRecord::Base
  attr_accessible :text, :parent_text

  has_one    :timing

  def serialize
    {
      :id => self.id,
      :text => self.text,
      :parent_text => self.parent_text.to_s
    }
  end

end
