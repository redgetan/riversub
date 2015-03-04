class ReleaseItemsController < ApplicationController
  def create
    debugger
    metadata = params[:video_metadata]

    # if video already exist not need to create another one
    @video = Video.where(:source_url => params[:source_url].gsub(/https/,"http"))
                  .first_or_create!({
                    :name => metadata[:data][:title],
                    :metadata => metadata,
                  })

    @release_item = ReleaseItem.new(release_id: params[:release_id],
                                    repository_id: @video.id)

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