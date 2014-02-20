# Load the rails application
require File.expand_path('../application', __FILE__)

# Initialize the rails application
River::Application.initialize!

# set_trace_func proc { |event, file, line, id, binding, classname|
#   if event.to_s == "line"
#     if key = binding.eval("defined?(session) && session rescue nil && session['warden.user.user.key']")
#       printf "%8s %s:%-2d %10s %8s =============== #{key}\n", event, file, line, id, classname 
#     end
#   end

# }
