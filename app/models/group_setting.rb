class GroupSetting < ActiveRecord::Base
  attr_accessible :group_id, :key, :value

  belongs_to :group
  
  def self.get(key)
    where(key: key).first.try(:value)
  end

  def self.set(key, value)
    obj = where(key: key).first_or_create!
    obj.update_column(:value, value)
    obj
  end
end
