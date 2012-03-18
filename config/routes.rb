QuestionnaireApp::Application.routes.draw do
  root :to => "home#index"

  match 'socky/auth' => 'sockies#auth'

  resources :documents, :path => "dokumenty"

  resources :users, :path => "uzytkownicy" do
    resources :documents, :path => "dokumenty"
  end

  # route for devise users
  devise_for :users, :path_prefix => 'app'
  resources :users
  
end
