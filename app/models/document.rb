class Document
  include Mongoid::Document
  include Mongoid::Timestamps
  
  field :title, :type => String
  field :public, :type => Boolean

  # Relationships
  embeds_many :lines
  belongs_to :user
  #belongs_to :folder
  
  # Validations
  validates_presence_of :title
      
  #accepts_nested_attributes_for :lines #for form
  
end
