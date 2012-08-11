# coding: utf-8
class LinesController < ApplicationController

before_filter :authenticate_user!
before_filter :find_document, :only => [:update, :create, :destroy]
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

  id =  params[:id]
  text = params[:text]
  break_at = params[:lineBreak].to_i
  
  current_line = @document.lines.find(id)
  next_line = current_line.next
  
  # create new line object
  new_line = Line.new
  new_line.document = @document
  
  # assign first part of the text to current line 
  current_line.text = text.slice(0,break_at)
  
  # assign rest of text to the newly created line (after bereak)
  new_line.text = text.slice(break_at, text.length)
  
  # ensure that newly created line have references to prev (current), and next (current.next)
  new_line.prevId = current_line.id
  new_line.nextId = current_line.nextId
  
  # save new line
  if new_line.save
    # update reference of current.next pointing to newly created line
    current_line.nextId = new_line.id 
    current_line.save
    unless next_line.nil?
      # update reference of next_line.prev pointing to newly created line
      next_line.prevId = new_line.id 
      next_line.save
    end
    render json: { current_line: {id: current_line.id, text: current_line.text}, new_line: {id: new_line.id, text: new_line.text}}
  else 
    render json: new_line.errors, status: :unprocessable_entity  
  end

end


def destroy
  id =  params[:id]
  current_line = @document.lines.find(id)
  
  prev_line = current_line.prev
  next_line = current_line.next
  
  prev_line.text += current_line.text
  
  # if removed line was the last one
  if next_line.nil?
    prev_line.nextId = nil
  else
    prev_line.nextId = next_line.id
    next_line.prevId = prev_line.id
  end

  if current_line.destroy
    prev_line.save
    next_line.save unless next_line.nil?
    render json: { deleted_line: {id: id}, prev_line: {id: prev_line.id, text: prev_line.text}}
  
  else 
    render json: current_line.errors, status: :unprocessable_entity  
  end
  
  
end


def old_create
  line = Line.new
  
  prevId = params[:prevId]
  if prevId
    prevLine = @document.lines.find(prevId)
    
    #line setting
    line.prevId = prevLine.id
    nextLine = prevLine.next
    if nextLine
      line.nextId = nextLine.nextId
    end
    #prevline setting
    prevLine.nextId = line.id
  end
  
  #return render :text => line.prev.inspect
  
  @document.lines << line
  
  if @document.save
     prevLine.save unless prevLine.nil?
     render json: {id: line.id, prevId: line.prevId}
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
