class User
  include Mongoid::Document
  include Mongoid::Timestamps
  
  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :trackable, :validatable
  
  # DEVISE 2.0 requires this fields defined explicitly for mongoid 
    
  ## Database authenticatable
  field :email,              type: String
  field :encrypted_password, type: String
  
  ## Recoverable
  field :reset_password_token,   :type => String
  field :reset_password_sent_at, :type => Time
  
  ## Rememberable
  field :remember_created_at, :type => Time
  
  ## Trackable
  field :sign_in_count,      type: Integer
  field :current_sign_in_at, type: Time
  field :last_sign_in_at,    type: Time
  field :current_sign_in_ip, type: String
  field :last_sign_in_ip,    type: String
                     
  field :username, type: String
  field :email, type: String
  
  # Relationships
  has_many :documents, inverse_of: "user"
  has_and_belongs_to_many :shared_documents, inverse_of: "sharing_users", class_name: "Document"
  
  # Validations
  validates_presence_of :username, :email, :encrypted_password
  validates_uniqueness_of :username, :email, case_sensitive: false
  attr_accessible :email, :password, :password_confirmation, :remember_me, :username, :age
  
  def fullname
    "#{username}"
  end
  
  # last 3 numbers from hash id (incremented)
  def numId
    id.to_s.slice(-9,9).hex.to_i
  end
  
end

