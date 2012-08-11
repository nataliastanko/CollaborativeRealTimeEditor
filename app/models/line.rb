class Line
  include Mongoid::Document
  include Mongoid::Timestamps

  field :text, type: String

  # Relationships
  field :nextId, type: Moped::BSON::ObjectId
  field :prevId, type: Moped::BSON::ObjectId

  # Relationships
  embedded_in :document
  
  def next
    getNP(nextId)
  end
  
  def prev
   getNP(prevId)
  end
  
  private
  def getNP (id)
    if id
      return document.lines.find(id)
    else
      return nil
    end
  end

end
