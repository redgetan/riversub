class Ability
  include CanCan::Ability

  def initialize(user)
    # Define abilities for the passed in user here. For example:
    #
    user ||= User.new # guest user (not logged in)

    define_repository_abilities(user)
    define_group_abilities(user)
    define_release_item_abilities(user)
    define_release_abilities(user)
    define_page_abilities(user)
    #
    # The first argument to `can` is the action you are giving the user 
    # permission to do.
    # If you pass :manage it will apply to every action. Other common actions
    # here are :read, :create, :update and :destroy.
    #
    # The second argument is the resource the user can perform the action on. 
    # If you pass :all it will apply to every resource. Otherwise pass a Ruby
    # class of the resource.
    #
    # The third argument is an optional hash of conditions to further filter the
    # objects.
    # For example, here the user can only update published articles.
    #
    #   can :update, Article, :published => true
    #
    # See the wiki for details:
    # https://github.com/ryanb/cancan/wiki/Defining-Abilities
  end

  def define_repository_abilities(user)
    can :read, Repository do |repo|
      repo.is_published || repo.owned_by?(user) 
    end

    can :edit, Repository do |repo|
      repo.owned_by?(user)
    end

    can :import, Repository do |repo|
      repo.belong_to_producer?(user)
    end
  end

  def define_page_abilities(user)
    can :edit, Page do |page|
      page.owned_by?(user)
    end
  end

  def define_group_abilities(user)
    can :read, Group

    if user.registered?
      can :create, Group
      
      can :edit, Group do |group|
        group.members.include?(user)
      end

      can :moderate, Group do |group|
        group.moderators.include?(user)
      end

      can :destroy, Group do |group|
        group.created_by?(user)
      end
    end
  end

  def define_release_abilities(user)
    can :read, Release do |release|
      if release.is_published? 
        true
      else
        release.group.members.include?(user)
      end
    end

    can [:edit], Release do |release|
      user.registered? && release.group.members.include?(user)
    end
  end

  def define_release_item_abilities(user)
    if user.registered?
      can :edit, ReleaseItem do |release_item|
        release_item.group.members.include?(user)
      end
    else
      cannot :manage, ReleaseItem
    end
  end
end
