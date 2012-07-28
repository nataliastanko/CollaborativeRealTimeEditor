RealTimeEditorApp::Application.routes.draw do
  root :to => "home#index"

  match 'socky/auth' => 'sockies#auth'
  match 'documents/:document_id/line' => 'lines#update', as: "update_line", via: "post"

  # route for devise users
  devise_for :users, path_prefix: 'app'
  resources :users
  
  resources :users do
    resources :documents
  end
  
  resources :documents do
  end
  
end
