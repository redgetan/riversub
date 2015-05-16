class SocialShare

  MAX_TWEET_CHAR = 140

  def tweet_repo(repo_token)
    unless repo = Repository.find_by_token(repo_token)
      raise "Repository #{repo_token} not found"
    end

    twitter_client.update_with_media(twitter_share_text(repo), repo.get_thumbnail_tempfile)
  end

  def tumblr_post_repo(repo_token)
    unless repo = Repository.find_by_token(repo_token)
      raise "Repository #{repo_token} not found"
    end

    tumblr_client.photo(TUMBLR_PAGE_URL, {
      :data => repo.get_thumbnail_tempfile.path, 
      :link => repo.url, 
      :caption => tumblr_caption_html(repo),
      :tags => repo.tag_list.join(",")
    })
  end

  def twitter_client
    @twitter_client ||= Twitter::REST::Client.new do |config|
      config.consumer_key    = TWITTER_CONSUMER_KEY
      config.consumer_secret = TWITTER_CONSUMER_SECRET
    end
  end

  def twitter_share_text(repo)
    tag_list = repo.tag_list 
    tags_text = ""

    loop do
      tags_text = tag_list.map { |tag| "#" + tag }.join(" ")
      tag_list.pop

      within_tweet_char_count = [repo.share_text,tags_text].join(" ").length < MAX_TWEET_CHAR
      break if (tag_list.empty? || within_tweet_char_count)
    end

    [repo.share_text, tags_text].join(" ")
  end

  def tumblr_client
    @tumblr_client ||= begin 
      Tumblr.configure do |config|
        config.consumer_key       = TUMBLR_CONSUMER_KEY
        config.consumer_secret    = TUMBLR_CONSUMER_SECRET
        config.oauth_token        = TUMBLR_OAUTH_TOKEN
        config.oauth_token_secret = TUMBLR_OAUTH_TOKEN_SECRET
      end

      Tumblr::Client.new
    end
  end

  def tumblr_caption_html(repo)
    <<-HTML
      <div style='margin: 15px 20px; color: #fff; position: absolute; top: 0; left: 10px; right: 0;   font-weight: 700; font-size: 13px;'>yasub.com</div>
      <a href="#{repo.url}" style='background: #f2f2f2; text-decoration: none; display: block;'>
        <h2 style='margin: 15px 0px; font-weight: 700; line-height: 25px; padding: 10px 10px 0px 10px;'>#{repo.share_text}</h2>
        <div style='margin: 15px 0; font-size: 14px; line-height: 1.5; padding: 0px 10px 10px 10px'>#{repo.share_description}</div>
      </div>
      </a>
    HTML
  end

end
