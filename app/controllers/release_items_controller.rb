class ReleaseItemsController < ApplicationController
  def create
    metadata = params[:video_metadata]

    @release = Release.find params[:release_id]
    authorize! :edit, @release

    @release_item = @release.release_items.create!

    # if video already exist not need to create another one
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http"))
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })

    # update video language if needed
    @video.update_attributes!(language: params[:video_language_code]) unless @video.language.present?

    # create repository
    @repo = Repository.new(video: @video, 
                           user: current_user, 
                           group_id: @release.group.id,
                           release_item_id: @release_item.id,
                           language: params[:repo_language_code])

    respond_to do |format|
      if @repo.save
        flash[:notice] = "Video added"
        format.html { redirect_to release_release_item_url([@release, @release_item]) , notice: 'Release Item was successfully created.' }
        format.json { render json: { redirect_url: @release.url }, status: :created }
      else
        format.html { render action: "new" }
        format.json { render json: @repo.errors, status: :unprocessable_entity }
      end
    end

  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.message }, :status => 403
  end

  def update
    @release_item = ReleaseItem.find(params[:id])

    respond_to do |format|
      if @release_item.update_attributes(params[:release_item])
        format.html { redirect_to @release_item.release.url, notice: 'Release Item was successfully updated.' }
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
      format.html { redirect_to @release_item.release.url }
      format.json { head :no_content }
    end
  end


end