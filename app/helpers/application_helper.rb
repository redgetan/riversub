module ApplicationHelper
  def url_for(options = nil)
    if Hash === options
      options[:protocol] ||= 'http'
    end
    super(options)
  end

  def user_facing_provider_name(provider)
    return :google if provider == :google_oauth2
    provider
  end

  def font_awesome_provider_name(provider)
    case provider
    when :google_oauth2
      "google-plus"
    when :facebook
      "facebook-square"
    else
      provider
    end
  end

  def social_button_provider_name(provider)
    case provider
    when :google_oauth2
      "google-plus"
    when :facebook
      "facebook"
    else
      provider
    end
  end

  def devise_mapping
    Devise.mappings[:user]
  end

  def resource_name
    devise_mapping.name
  end

  def resource_class
    devise_mapping.to
  end

  def resource
    @resource ||= User.new
  end

  def lobster_errors_for(object, message=nil)
    html = ""
    unless object.errors.blank?
      html << "<div class=\"flash-error\">\n"
      object.errors.full_messages.each do |error|
        html << error << "<br>"
      end
      html << "</div>\n"
    end

    raw(html)
  end

  def login_url
    new_user_session_url
  end

  def time_ago_in_words_label(*args)
    label_tag(nil, time_ago_in_words(*args), :title => args.first.strftime("%F %T %z"))
  end

  def format_time(secs)
    [60, 60, 24, 1000].map{ |count|
      if secs > 0
        secs, n = secs.divmod(count)
        n
      end
    }.compact.reverse.each_with_index.map { |n, index| 
      if index != 0 && n.to_s.length != 2  
        "0#{n}"
      else
        n
      end
    }.join(':')
  end

end
