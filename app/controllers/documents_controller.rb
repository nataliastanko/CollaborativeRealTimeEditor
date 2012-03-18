# coding: utf-8
class DocumentsController < ApplicationController

  before_filter :authenticate_user!
  before_filter :find_document, :only => [:show, :save, :answers]

  # preview inly
  def show
    #@document.questions.build #create one object
  end

  def save
    answers = params[:answers].collect{ |a| a[1] }
    answers.each do |answer_param|
      
      question = @document.questions.find(answer_param[:question_id])
      question.answers.create({
        :answer => answer_param[:answer],
        :user_id => current_user.id,
        :question_id => answer_param[:question_id]
      })
      
    end    
    @document.save    
    redirect_to answers_document_path(@document)    
  end
  
  def index
    @documents = @documents = Document.all
  end
  
  def edit
    @document = Document.find(params[:id])
  end
  
  def new
    @document = Document.new
  end
  
  def create
    @document = Document.new(params[:document])
    @document.user = current_user
    if @document.save
      flash[:notice] = "Utworzono dokument."
      redirect_to edit_document_path(@document)
      #redirect_to action: 'index'
    else
      flash.now[:error] = "Nie można utworzyć tego dokumentu"
      render action: 'new'
    end
  end

  def destroy
    @document = Document.find(params[:id])
    @document.destroy

    respond_to do |format|
      format.html { redirect_to documents_path(current_user) }
      format.json { head :ok }
    end
  end
  
  def update
    respond_to do |format|
     if @document.update_attributes(params[:document])
        format.html { redirect_to document_questions_path(@document), notice: "Zapisano zmiany dokumetu!" }
        format.json { head :ok }
     else
        format.html { render action: "edit" }
        format.json { render json: @document.errors, status: :unprocessable_entity }
     end
   end 
  end

  private 
  
  def find_document
    @document = Document.find(params[:id])
  end

end
