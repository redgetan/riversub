class Membership < ActiveRecord::Base
  attr_accessible :group_id, :user_id, :is_owner

  belongs_to :group
  belongs_to :user

  include PublicActivity::Model

  tracked :only  => :create,
          :owner => Proc.new{ |controller, model| 
            model.class.respond_to?(:current_user) ? model.class.current_user : nil
          },
          :params => {
            :group_short_name => Proc.new { |controller, model| 
              model.group.short_name
            }
          }


  
end
