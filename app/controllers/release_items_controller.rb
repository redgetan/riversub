class ReleaseItemsController < ApplicationController
  def create
    metadata = params[:video_metadata]

    @release = Release.find params[:release_id]

    # if video already exist not need to create another one
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http"))
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })

    # update video language if needed
    @video.update_attributes!(language: params[:video_language_code]) unless @video.language.present?

    # create repository
    @repo = Repository.create!(video: @video, user: current_user, language: params[:repo_language_code])
    @repo.group_repositories.create!(group_id: @release.group.id) 

    # create release item
    @release_item = @release.release_items.build(repository_id: @repo.id)

    respond_to do |format|
      if @release_item.save
        format.html { redirect_to @release_item, notice: 'Release Item was successfully created.' }
        format.json { render json: @release_item, status: :created, location: @release_item }
      else
        format.html { render action: "new" }
        format.json { render json: @release_item.errors, status: :unprocessable_entity }
      end
    end

  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end

  def update
    @release_item = ReleaseItem.find(params[:id])

    respond_to do |format|
      if @release_item.update_attributes(params[:release_item])
        format.html { redirect_to @release_item, notice: 'Release Item was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @release_item.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @release_item = ReleaseItem.find(params[:id])
    @release_item.destroy

    respond_to do |format|
      format.html { redirect_to releases_url }
      format.json { head :no_content }
    end
  end


end