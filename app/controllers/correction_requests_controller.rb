class CorrectionRequestsController < ApplicationController
  def approve
    cr = CorrectionRequest.find(params[:id])  
    cr.approve
    flash[:notice] = "Correction Approved"
    redirect_to cr.approver.corrections_url
  end

  def reject
    cr = CorrectionRequest.find(params[:id])  
    cr.reject
    flash[:notice] = "Correction Rejected"
    redirect_to cr.approver.corrections_url
  end
end