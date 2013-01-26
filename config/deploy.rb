# RVM bootstrap
require 'rvm/capistrano'
require "bundler/capistrano"

set :rvm_ruby_string, 'ruby-1.9.3-head'
set :rvm_type, :system
set :keep_releases, 2
set :normalize_asset_timestamps, false

# server details
default_run_options[:pty] = true
ssh_options[:forward_agent] = true
set :deploy_to, "/var/www/apps/editor"
set :deploy_via, :remote_cache
set :use_sudo, false

# main details
set :application, "editor"
role :web, "editor.anithaly.com"
role :app, "editor.anithaly.com"
role :db,  "editor.anithaly.com", :primary => true

# repo details
set :scm, :git
set :repository,  "git@bitbucket.org:anithaly/editor.git"
set :branch, "master"


# passenger deployment
namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
  end  
end

namespace :shared do
  desc "Symlink shared resources on each release"
  task :create_symlink, :roles => :app do
    run "ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml"
  end
end

namespace :socky do
  
  desc "Starts socky server"
  task :start, :roles => :app do
    run "cd #{current_path}/socky-server && thin -R config.ru -p3001 -d start"
  end
  
  desc "Stops socky server"
  task :stop, :roles => :app do
    run "cd #{current_path}/socky-server && thin stop"
  end  
  
end

# after 'deploy:finalize_update', 'shared:create_symlink'
before 'deploy', 'socky:stop'
after 'deploy', 'deploy:cleanup'
after 'deploy', 'socky:start'