class Element
  attr_accessor :base_value, :goe_value, :value, :validity, :comment, :invalid

  class << self
    def base_values
      @bvsovs ||= read_bvsovs
      @base_values 
    end

    def sovs
      @bvsovs ||= read_bvsovs
      @sovs
    end
    def read_bvsovs
      require 'csv'
      csv = CSV.read('dat/bvsov.csv', headers: true)

      @base_values = {}
      @sovs = {}
      csv.each do |data|
        @base_values[data["Element"]] = [data["BV"].to_f, data["V"].to_f, data["V1"].to_f]
        @sovs[data["Element"]] = [data["neg3"].to_f, data["neg2"].to_f, data["neg1"].to_f, data["flat"].to_f, data["pos1"].to_f, data["pos2"].to_f, data["pos3"].to_f]
      end
    end
    ################
  end
  def initialize(element, goe: 0)
    @base_value = 0
    @goe_value = 0
    @value = 0
    @invalid = false
    @goe = 0
    if @element = element.presence
      @base_value = self.class.base_values[@element] || [0, 0, 0]
      @goe_value = self.class.sovs[@element].try(:[], goe.to_i+3) || 0.0
    end
  end

  def base_value
    (@invalid) ? 0 : @base_value[0]
  end
  def value
    (@invalid) ? 0 : @value
  end
end

################################################################
