class GroupsController < ApplicationController
  load_resource :find_by => :short_name
  # authorize_resource

  def index
    @groups = Group.all.sort_by { |group| group.members.count }.reverse

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @groups }
    end
  end

  def show
    @group_repos = if @group.short_name == "jpweekly" 
                     if params[:repo_status] == "draft"
                       @group.draft_repositories.includes(:video, { :timings => :subtitle }, :user).where(language: "en").order("updated_at DESC").page params[:page]
                     else
                       @group.published_repositories.includes(:video, { :timings => :subtitle }, :user).where(language: "en").recent.page params[:page]
                     end
                   else
                     if params[:repo_status] == "draft"
                       @group.draft_repositories.includes(:video, { :timings => :subtitle }, :user).order("updated_at DESC").page params[:page]
                     else
                       @group.published_repositories.includes(:video, { :timings => :subtitle }, :user).recent.page params[:page]
                     end
                   end
                   
    @activities  = @group.public_activities.includes(:trackable, :owner).limit(5)
    @requests = if params[:status] == "open"
                  @group.requests.includes(:group, :video, :submitter).pending.recent
                elsif params[:status] == "closed"
                  @group.requests.includes(:group, :video, :submitter).closed.recent
                else
                  @group.requests.includes(:group, :video, :submitter).pending.recent
                end

    @comment = @group.comment_threads.build
    @comments = @group.comment_threads.includes(:user).arrange_for_user(current_user)
    Comment.highlight_comment(@comments,params[:comment_short_id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @group }
    end
  end

  def new
    if !user_signed_in?
      flash[:error] = "You must be logged in to create a topic"
      store_location
      redirect_to new_user_session_url and return
    end

    # @group = Group.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @group }
    end
  end

  def edit
    # @group = Group.find_by_short_name(params[:id])
    # authorize! :create, @release.release_items
  end

  def join
    unless user_signed_in?
      flash[:error] = "You must be logged in to subscribe to a topic"
      store_location(@group.url)
      redirect_to new_user_session_url and return
    end

    @group.memberships.create!(user_id: current_user.id)

    flash[:notice] = "Subscribed to #{@group.name}"
    redirect_to @group.url
  end

  def add_moderator
    unless can? :edit, @group
      flash[:error] = "You dont have permission to do that"
      redirect_to @group.members_url and return
    end

    unless @user = User.find_by_username(params[:username])
      flash[:error] = "User #{params[:username]} does not exist"
      redirect_to @group.members_url and return
    end

    @membership = @group.memberships.where(user_id: @user.id).first_or_create!
    @membership.is_owner = true
    @membership.save!

    flash[:notice] = "#{@user.username} added as moderator"
    redirect_to @group.members_url
  end

  def change_avatar
    @group.avatar = params[:group][:avatar]
    if @group.save
      render :text => @group.avatar.url
    else 
      render :text => @group.errors.full_messages.join(". "), :status => 400
    end
  end

  def create
    @group.creator_id = current_user.try(:id)

    respond_to do |format|
      if @group.save
        format.html { redirect_to @group, notice: 'Topic was successfully created.' }
        format.json { render json: @group, status: :created, location: @group }
      else
        format.html { render action: "new" }
        format.json { render json: @group.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    # @group = Group.find_by_short_name(params[:id])

    respond_to do |format|
      if @group.update_attributes(params[:group])
        format.html { redirect_to @group, notice: 'Topic was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @group.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    # @group = Group.find_by_short_name(params[:id])
    @group.destroy

    respond_to do |format|
      format.html { redirect_to groups_url }
      format.json { head :no_content }
    end
  end
end
