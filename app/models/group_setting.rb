class GroupSetting < ActiveRecord::Base
  attr_accessible :group_id, :key, :value

  belongs_to :group
  
  def self.get(key)
    select { |setting| setting.key == key}.first.try(:value)
  end
end
