require 'socky/authenticator'

class SockiesController < ApplicationController

  skip_before_filter :verify_authenticity_token, :only => [:auth]

  def auth
    # Authenticate user. If, for any reason, this method return status other that 200 then user will not be connected.
    result = Socky::Authenticator.authenticate(params, :allow_changing_rights => true, :secret => '90fsbsgf64554cvxcvcxvSS')
    render :json => result
  end

end
