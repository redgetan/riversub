
FactoryGirl.define do
  sequence(:increasing_time) {|n| n * 5 }

  factory :timing do
    start_time { generate(:increasing_time) }
    end_time   { generate(:increasing_time) }
    subtitle
  end
end