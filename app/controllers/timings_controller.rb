class TimingsController < ApplicationController

  def save
    @repo = Repository.find params[:repository_id]

    @creates = []
    @updates = []

    ActiveRecord::Base.transaction do
      params[:timings].each do |action,values|
        case action
        when "creates"
          values.each do |i, timing_param|
            @timing = @repo.timings.create!(timing_param)
            @creates << @timing
          end
        when "updates"
          values.each do |i, timing_param|
            id = timing_param.delete(:id)
            @timing = @repo.timings.find(id)
            @timing.update_attributes!(timing_param)
            @updates << @timing
          end
        when "destroys"
          values.each do |id|
            @timing = @repo.timings.find(id)
            @timing.destroy
          end
        else
        end
      end
    end

    render :json => { :creates => @creates.map(&:serialize),
                      :updates => @updates.map(&:serialize)}.to_json, :status => 200
  rescue ActiveRecord::RecordInvalid => e
    render :json => { :error => e.record.errors }, :status => 403
  end

  def index
    @repo = Repository.find params[:repository_id]
    send_data @repo.to_srt, :type => "text/plain", :filename => "#{@repo.name}.srt"
  end

end
