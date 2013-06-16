module ApplicationHelper
  def url_for(options = nil)
    if Hash === options
      options[:protocol] ||= 'http'
    end
    super(options)
  end
end
