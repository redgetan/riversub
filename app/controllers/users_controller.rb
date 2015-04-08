class UsersController < ApplicationController
  #before_filter :fetch_youtube_owner_caption, :only => [:show]
  def show
    @user = User.find_by_username(params[:username])

    @repositories = if user_signed_in? && current_user == @user
                      @user.repositories # all
                    else
                      @user.repositories.published # if not logged in, show only published ones
                    end


    if @access_token = session['access_token']
      result = RestClient.get('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', 
                              { "Authorization" => "Bearer #{@access_token}"})
      data = JSON.parse(result)
      uploads_id = data["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

      result = RestClient.get("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=#{uploads_id}", 
                          { "Authorization" => "Bearer #{@access_token}"})

      @uploaded_items = JSON.parse(result)
    end
      # get all my public videos
      #doc.css("entry")[0].css("content")[0].attributes["lang"].value
  end
end
