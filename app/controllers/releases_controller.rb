class ReleasesController < ApplicationController

  before_filter :load_group

  def index
    @releases = releases

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @releases }
    end
  end

  def show
    @release = releases.find_by_release_number(params[:id])

    unless can? :read, @release
      if user_signed_in?
        flash[:error] = "You don't have permission to see that"
        redirect_to root_url and return
      else
        store_location
        redirect_to new_user_session_url and return
      end
    end

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @release }
    end
  end

  def new
    @release = releases.build
    authorize! :edit, @group

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @release }
    end
  end

  def edit
    @release = releases.find_by_release_number(params[:id])
    authorize! :edit, @release
  end

  def create
    @release = releases.build(params[:release])
    authorize! :edit, @group

    respond_to do |format|
      if @release.save
        format.html { redirect_to @release.url, notice: 'Release was successfully created.' }
        format.json { render json: @release, status: :created }
      else
        format.html { render action: "new" }
        format.json { render json: @release.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    @release = releases.find_by_release_number(params[:id])
    authorize! :edit, @release

    respond_to do |format|
      if @release.update_attributes(params[:release])
        format.html { redirect_to @release.url, notice: 'Release was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @release.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /releases/1
  # DELETE /releases/1.json
  def destroy
    @release = releases.find_by_release_number(params[:id])
    @release.destroy

    respond_to do |format|
      format.html { redirect_to @group.url }
      format.json { head :no_content }
    end
  end

  private

    def load_group
      @group = Group.find_by_short_name(params[:group_id])
    end

    def releases
      @group.releases   
    end

end
