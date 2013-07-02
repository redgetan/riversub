FactoryGirl.define do
  sequence(:some_name) {|n| "anon_#{n}" }
  sequence(:some_email) {|n| "girl_#{n}@yahoo.com" }
  factory :user do
    username { generate(:some_name) }
    email { generate(:some_email) }
    after(:build) { |u| u.password_confirmation = u.password = "some_pass" }
  end
end