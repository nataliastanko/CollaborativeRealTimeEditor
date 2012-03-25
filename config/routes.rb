QuestionnaireApp::Application.routes.draw do
  root :to => "home#index"

  match 'socky/auth' => 'sockies#auth'

  resources :documents

  resources :users do
    resources :documents
  end

  # route for devise users
  devise_for :users, :path_prefix => 'app'
  resources :users
  
end
