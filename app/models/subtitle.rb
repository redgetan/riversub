class Subtitle < ActiveRecord::Base

  has_paper_trail 

  attr_accessible :text, :parent_text

  has_one    :timing

  before_save :strip_crlf_text

  def serialize
    {
      :id => self.id,
      :text => self.text,
      :parent_text => self.parent_text.to_s
    }
  end

  def strip_crlf_text
    self.text.gsub("\n"," ")
  end

end
