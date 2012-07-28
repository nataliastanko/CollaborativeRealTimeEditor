# coding: utf-8
class LinesController < ApplicationController

before_filter :authenticate_user!
before_filter :find_line, :only => [:update]

def update
  @line.text = params[:text]
  if @line.save
     head :ok
  else 
     render json: @line.errors, status: :unprocessable_entity
  end
end

private

def find_line
  @document = Document.find(params[:document_id])
  @line = @document.lines.find(params[:id])
end
  
end
