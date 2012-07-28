# coding: utf-8
class UsersController < ApplicationController
  before_filter :authenticate_user!

  def show
    @user = User.find(params[:id])
  end
  
  #def user_questionnaires
  #  @user = User.find(params[:user_id])
  #  @questionnaires = @user.questionnaires.all
  #end
  
  def index
    @users = User.all
  end
  
  def edit
    @user = User.find(params[:id])
  end

  def destroy
    @user = User.find(params[:id])
    @user.destroy

    respond_to do |format|
      format.html { redirect_to users_url }
      format.json { head :ok }
    end
  end
  
  def update
    @user = User.find(params[:id])
    respond_to do |format|
     if @user.update_attributes(params[:user])
        format.html { redirect_to @user, notice: "Użytkownik <strong>#{@user.fullname}</strong> został zapisany!" }
        format.json { head :ok }
     else
        format.html { render action: "edit" }
        format.json { render json: @user.errors, status: :unprocessable_entity }
     end
   end 
  end

end
