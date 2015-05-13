class SocialShare
  def tweet_repo(repo_token)
    unless repo = Repository.find_by_token(repo_token)
      raise "Repository #{repo_token} not found"
    end

    thumbnail_tempfile = get_thumbnail_tempfile(repo.thumbnail_url_hq)
    twitter_client.update_with_media(repo.share_text, thumbnail_tempfile)
  end

  def tumblr_post_repo(repo_token)
    unless repo = Repository.find_by_token(repo_token)
      raise "Repository #{repo_token} not found"
    end

    # thumbnail_tempfile = get_thumbnail_tempfile(repo.thumbnail_url_hq)
    tumblr_client.post("redgetan", {
      :title => repo.share_text,
      :description => repo.share_description,
      :url => repo.url,
    })
  end


  def twitter_client
    @twitter_client ||= Twitter::REST::Client.new do |config|
      config.consumer_key    = TWITTER_CONSUMER_KEY
      config.consumer_secret = TWITTER_CONSUMER_SECRET
    end
  end

  def tumblr_client
    Tumblr.configure do |config|
      config.consumer_key       = TUMBLR_CONSUMER_KEY
      config.consumer_secret    = TUMBLR_CONSUMER_SECRET
      config.oauth_token        = TUMBLR_OAUTH_TOKEN
      config.oauth_token_secret = TUMBLR_OAUTH_TOKEN_SECRET
    end
  end

  def get_thumbnail_tempfile(thumbnail_url)
    @thumbnail_tempfile ||= begin
      require 'tempfile'
      require 'open-uri'

      content = open(thumbnail_url).read

      tempfile = Tempfile.new("repo_thumbnail")
      tempfile.binmode # switch to binary mode to be able to write image (default is text)
      tempfile.write(content)
      tempfile.rewind
      tempfile
    end
  end

end
