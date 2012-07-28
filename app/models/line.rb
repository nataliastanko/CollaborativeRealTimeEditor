class Line
  include Mongoid::Document
  include Mongoid::Timestamps

  field :text, type: String

  # Relationships
  has_one :next, :class_name => "Line"
  has_one :prev, :class_name => "Line"

  # Relationships
  embedded_in :document
  
  # Validations
  #validates_presence_of :text

end
