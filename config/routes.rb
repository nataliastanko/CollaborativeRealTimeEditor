QuestionnaireApp::Application.routes.draw do
  #get \"users\/show\"

  root :to => "home#index"

 # route for devise users
  devise_for :users, :path_prefix => 'app'
  resources :users
  
  resources :questionnaires, :path => "ankiety" do
    resources :questions do
      resources :answers
    end

    get 'wypelnij', :on => :member, :to => "questionnaires#fill", :as => :fill
    post 'wypelnij', :on => :member, :to => "questionnaires#submit", :as => :submit
    get 'odpowiedzi', :on => :member, :to => "questionnaires#answers", :as => :answers

  end
  
  resources 'questions'
  
  resources :users, :path => "uzytkownicy" do
    get 'ankiety', :to => 'users#user_questionnaires', :as => :questionnaires
  end
  
  get 'szukaj', :to => "search#index", :as => :search
  get 'szukaj/wyniki', :to => "search#results", :as => :search_results
  
end
