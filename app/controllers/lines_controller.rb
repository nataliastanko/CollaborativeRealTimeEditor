# coding: utf-8
class LinesController < ApplicationController

before_filter :authenticate_user!
before_filter :find_document, :only => [:update, :create, :find_line]
before_filter :find_line, :only => [:update]

def update
  @line.text = params[:text]
  if @line.save
     head :ok
  else 
     render json: @line.errors, status: :unprocessable_entity
  end
end

def create
  line = Line.new
  
  prevId = params[:prev_id]
  if prevId
    prevLine = @document.lines.find(prevId)
    
    #line setting
    line.prev = prevLine
    nextLine = prevLine.next
    if nextLine
      line.next = nextLine
    end
    #prevline setting
    prevLine.next = line
    
  end
  @document.lines << line
  
  if @document.save
     prevLine.save unless prevLine.nil?
     render json: line
  else 
     render json: line.errors, status: :unprocessable_entity
  end
end

private

def find_line
  @line = @document.lines.find(params[:id])
end

def find_document
  @document = Document.find(params[:document_id])
end
  
end
