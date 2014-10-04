class GroupRepository < ActiveRecord::Base
  attr_accessible :group_id, :repository_id

  belongs_to :group
  belongs_to :repository
  
end
