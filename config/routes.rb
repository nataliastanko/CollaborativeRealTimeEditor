RealTimeEditorApp::Application.routes.draw do
  root :to => "home#index"

  match 'socky/auth' => 'sockies#auth'
  match 'documents/:document_id/line/update' => 'lines#update', as: "update_line", via: "post"
  match 'documents/:document_id/line/create' => 'lines#create', as: "new_line", via: "post"
  match 'documents/:document_id/line/destroy' => 'lines#destroy', as: "destroy_line", via: "post"

  # route for devise users
  devise_for :users, path_prefix: 'app'
  resources :users
  
  resources :users do
    resources :documents
  end
  
  resources :documents do
  end
  
end
