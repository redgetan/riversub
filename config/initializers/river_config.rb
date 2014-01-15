GUIDED_WALKTHROUGH_URL = if Rails.env == "production"
                           "#"
                         elsif Rails.env == "development"
                           "http://localhost:3000/videos/OHBFIjapgHM/editor"
                         end