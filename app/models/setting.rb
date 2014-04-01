class Setting < ActiveRecord::Base
  attr_accessible :key, :value
  
  def self.get(key)
    where(key: key).first.value
  end
end
