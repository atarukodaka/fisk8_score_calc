Rails.application.routes.draw do
  resources :calc, only: [:index]
end
