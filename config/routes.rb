QuestionnaireApp::Application.routes.draw do
  #get \"users\/show\"

  root :to => "home#index"

 # route for devise users
  devise_for :users, :path_prefix => 'app'
  resources :users
  
  resources :documents, :path => "dokumenty"

#  resources :questionnaires, :path => "ankiety" do
#    resources :questions do
#      resources :answers
#    end
#
#    get 'wypelnij', :on => :member, :to => "questionnaires#fill", :as => :fill
#    post 'wypelnij', :on => :member, :to => "questionnaires#submit", :as => :submit
#    get 'odpowiedzi', :on => :member, :to => "questionnaires#answers", :as => :answers
#
# end
  
#  resources 'questions'
  
  resources :users, :path => "uzytkownicy" do
    resources :documents, :path => "dokumenty"
  end
  
end
