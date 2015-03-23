xml.instruct! :xml, :version => "1.0" 
xml.rss :version => "2.0", "xmlns:content" => "http://purl.org/rss/1.0/modules/content/" do
  xml.channel do
    xml.title @group.name
    xml.description @group.description
    xml.link @group.url

    @releases.each do |release|
      xml.item do
        xml.title release.rss_title
        xml.link  release.url
        xml.pubDate release.date
        xml.tag!("content:encoded", release.mailchimp_content_encoded)
      end
    end
  end
end