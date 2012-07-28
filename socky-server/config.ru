require 'socky/server'

options = {
  :debug => true,
  :applications => {
    :editor => '90fsbsgf64554cvxcvcxvSS',
  }
}

map '/websocket' do
  run Socky::Server::WebSocket.new options
end

map '/http' do
  use Rack::CommonLogger
  run Socky::Server::HTTP.new options
end
