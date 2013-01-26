class HomeController < ApplicationController
  def index
    @documents = Document.limit(10).order_by([:created_at, :desc])
  end
  
  def info
  end
  
end
