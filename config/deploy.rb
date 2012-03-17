# RVM bootstrap
$:.unshift(File.expand_path("~/.rvm/lib"))
require 'rvm/capistrano'
#require 'thinking_sphinx/deploy/capistrano'
set :rvm_ruby_string, 'ruby-1.9.3-p0'
set :rvm_type, :user
set :keep_releases, 2
set :normalize_asset_timestamps, false

# main details
set :application, "anithaly-questions"
role :web, "192.166.219.232"
role :app, "192.166.219.232"
role :db,  "192.166.219.232", :primary => true

# server details
set :deploy_to, "/var/www/apps/#{application}/"
set :deploy_via, :remote_cache
set :user, "johny"
set :use_sudo, false

#set :bundle_roles, [:app]
#require 'bundler/capistrano'

# repo details
set :scm, :git
set :repository, "git@bitbucket.org:floatnet/questions.git"
set :branch, "master"

# runtime dependencies
# depend :remote, :gem, "bundler", ">=1.0.0.rc.2"

# tasks
namespace :deploy do
  task :start, :roles => :app do
    run "touch #{current_path}/tmp/restart.txt"
  end

  task :stop, :roles => :app do
    # Do nothing.
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "touch #{current_path}/tmp/restart.txt"
  end

  desc "Symlink shared resources on each release"
  task :symlink_shared, :roles => :app do
    #run "ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml"
  end
  
  desc "Precompiling assets after deploys"
  task :precompile_assets, :roles => :app do
    run "cd #{release_path} && RAILS_ENV=production bundle exec rake assets:precompile"
  end

  desc "Link up Sphinx's indexes."
  task :symlink_sphinx_indexes, :roles => :app do
    run "ln -nfs #{shared_path}/db/sphinx #{release_path}/db/sphinx"
  end
  
  task :activate_sphinx, :roles => :app do
    #symlink_sphinx_indexes
    #run "cd #{release_path} && RAILS_ENV=production bundle exec rake thinking_sphinx:configure"
    #ts.rebuild
    #ts.start
    #ts.in
    #run "cd #{release_path} && RAILS_ENV=production bundle exec rake thinking_sphinx:start"  
  end
  
  #before 'deploy:update_code', 'ts:stop'
  #after 'deploy', 'deploy:activate_sphinx'  
  
end

namespace :bundler do
  desc "Symlink bundled gems on each release"
  task :symlink_bundled_gems, :roles => :app do
    run "mkdir -p #{shared_path}/vendor_bundle"
    run "ln -nfs #{shared_path}/vendor_bundle #{release_path}/vendor/bundle"
  end

  desc "Install for production"
  task :install, :roles => :app do
    run "cd #{current_path} && bundle install --deployment"
  end
end

namespace :whenever do
  
  desc "Clear Cron"
  task :clear_cron, :roles => :app  do
    run "cd #{current_path} && bundle exec whenever --clear-crontab itekna"
  end

  desc "Update Cron"
  task :update_cron, :roles => :app  do
    run "cd #{current_path} && bundle exec whenever --write-crontab itekna"
  end
  
end


# Mongoid sphinx recipes
namespace :ms do

  task :configure do
    run "cd #{current_path} && RAILS_ENV=production bundle exec rake mongoid_sphinx:configure"
  end
  task :index do
    run "cd #{current_path} && RAILS_ENV=production bundle exec rake mongoid_sphinx:index"
  end
  task :start do
    run "cd #{current_path} && RAILS_ENV=production bundle exec rake mongoid_sphinx:start"
  end
  task :stop do
    run "cd #{current_path} && RAILS_ENV=production bundle exec rake mongoid_sphinx:stop"
  end
  task :restart do
    run "cd #{current_path} && RAILS_ENV=production bundle exec rake mongoid_sphinx:restart"
  end
   
end


after 'deploy:update_code', 'deploy:symlink'
after 'deploy:update_code', 'bundler:symlink_bundled_gems'
after 'deploy:update_code', 'bundler:install'
after 'deploy:update_code', 'deploy:symlink_sphinx_indexes'
after 'deploy:update_code', 'deploy:precompile_assets'
#after 'deploy:update_code', 'whenever:update_cron'
after 'deploy', 'deploy:cleanup'
