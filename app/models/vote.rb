class Vote < ActiveRecord::Base
  belongs_to :voter, :class_name => "User"

  VOTABLE_TYPES_TO_TRACK = ["Repository", "Subtitle"]

  include PublicActivity::Model

  tracked :only  => :create, 
          :on    => {:create => proc {|model, controller| 
                      VOTABLE_TYPES_TO_TRACK.include?(model.votable_type)
                   }},
          :owner => Proc.new{ |controller, model| model.class.current_user }


end
