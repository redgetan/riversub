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

end
