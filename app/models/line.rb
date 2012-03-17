class Line
  include Mongoid::Document
  include Mongoid::Timestamps

  field :text, type: String
  
  # Relationships
  embedded_in :document
  
  # Validations
  #validates_presence_of :text

end
