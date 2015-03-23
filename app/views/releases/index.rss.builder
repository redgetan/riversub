xml.instruct! :xml, :version => "1.0" 
xml.rss :version => "2.0", "xmlns:media" => "http://search.yahoo.com/mrss/" do
  xml.channel do
    xml.title @group.name
    xml.description @group.description
    xml.link @group.url

    @releases.each do |release|
      xml.item do
        xml.title release.rss_title
        xml.link  release.url
        xml.pubDate release.date
        release.repositories.each do |repo|
          xml.tag!("media:group") do
            xml.tag!("media:title", repo.release_title)
            xml.tag!("media:original_title", repo.video_title_for_release)
            xml.tag!("media:thumbnail", repo.thumbnail_url)
            xml.tag!("media:link", repo.url)
            xml.tag!("media:duration", repo.formatted_duration)
          end
        end
      end
    end
  end
end