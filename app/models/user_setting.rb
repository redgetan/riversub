class UserSetting < ActiveRecord::Base
  attr_accessible :user_id, :key, :value

  belongs_to :user
  
  def self.get(key)
    where(key: key).first.try(:value)
  end

  def self.set(key, value)
    obj = where(key: key).first_or_create!
    obj.update_column(:value, value)
  end
end
