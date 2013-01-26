# coding: utf-8
class DocumentsController < ApplicationController

  before_filter :authenticate_user!
  before_filter :find_document, :only => [:show, :save, :update, :answers, :invite, :share]

  # preview inly
  def show
    @document = Document.where({"$or"=>[{"user_id"=> current_user.id}, {"sharing_user_ids"=>current_user.id}]}).find(params[:id])
  end
  
  def index
    @documents = Document.where({"$or"=>[{"user_id"=> current_user.id}, {"sharing_user_ids"=>current_user.id}]})
  end
  
  def edit
    @document = Document.where({"$or"=>[{"user_id"=> current_user.id}, {"sharing_user_ids"=>current_user.id}]}).find(params[:id])
  end
  
  def new
    @document = Document.new
  end
  
  def share
    @user = User.find(params[:user_id])
    @document.sharing_users << @user
    if @document.save
      flash[:notice] = "Zaproszono użytkownika do dokumentu."
      redirect_to documents_path
      #redirect_to action: 'index'
    else
      flash.now[:error] = "Nie zaprosić użytkownika do tego dokumentu"
      render action: 'invite'
    end
  end
  
   def invite
    @sharnig_users = @document.sharing_user_ids
    #@sharnig_users << current_user.id.to_s
    @users = User.not_in(:_id => current_user)
  end
  
  def create
    @document = Document.new(params[:document])
    @document.user = current_user
    @document.lines << Line.new # 1 linia w kolekcji, gwarantuje transakcję, linia sie zapisze, jesli dokument się zapisze
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
  
  # change title
  def update
    respond_to do |format|
     if @document.update_attributes(params[:document])
        format.json { head :ok }
	format.js {head :ok}
     else
        #format.html { render action: "edit" }
        format.json { render json: @document.errors, status: :unprocessable_entity }
     end
   end 
  end
  
  def destroy
    @document = current_user.documents.find(params[:id])
    if @document.destroy
      flash[:notice] = "Dokument został usunięty."
      redirect_to documents_path
    end
  end
  
  private 
  
  def find_document
    @document = Document.find(params[:id])
  end

end
