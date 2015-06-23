Vote = ActsAsVotable::Vote

class Vote
  belongs_to :voter, :class_name => "User"
  belongs_to :votable, :polymorphic => true

  VOTABLE_TYPES_TO_TRACK = ["Repository", "Subtitle"]

  include PublicActivity::Model

  tracked :only  => :create,
          :on    => {:create => proc {|model, controller| 
                      VOTABLE_TYPES_TO_TRACK.include?(model.votable_type)
                   }},
          :owner => Proc.new{ |controller, model| 
            model.class.respond_to?(:current_user) ? model.class.current_user : nil
          }, 
          :params => {
            :group_short_name => Proc.new { |controller, model| 
              case model.votable
              when Repository
                model.votable.group.short_name
              when Subtitle
                model.votable.repository.group.short_name
              else
                nil
              end
            }
          }

end



