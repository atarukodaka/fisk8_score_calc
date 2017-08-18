class IndivisualJump < Element
  ################################################################
  attr_reader :sovs, :rotation, :type, :is_axel, :seq
  def initialize(element)
    @normalized_jump = element
    
    if element =~ /^(.*)\<\</
      @downgraded = true
      @normalized_jump = $1
    elsif element =~ /^(.*)\</
      @underrotated = true
      @normalized_jump = $1
    end
    if element =~ /^(.*)\!/
      @edge_error = true
      @normalized_jump = $1
    end

    @normalized_jump =~ /^([0-4]?)(.*)$/
    @rotation, @type = $1.to_i, $2
    @is_axel = (@type == "A") ? true : false
    @seq = false
    
    if @downgraded
      if @rotation == 1
        @base_value = 0
        @sovs = []
      else
        v = (@edge_error) ? 1 : 0
        downgraded_jump = "#{rotation-1}#{type}"
        @base_value = self.class.base_values[downgraded_jump][v].to_f
        @sovs = self.class.sovs[downgraded_jump]
      end
    else
      v = 0
      v += 1 if @underrotated
      v += 1 if @edge_error
      @base_value = self.class.base_values[@normalized_jump][v]
      @sovs = self.class.sovs[@normalized_jump]
    end
  end
end

################################################################
class Jump < Element  
  attr_accessor :is_axel, :is_combination, :is_combination3, :indivisual_jumps
  attr_accessor :credit, :goe
  def initialize(element, credit: false, goe: 0)
    @indivisual_jumps = []
    @base_value = 0.0
    @goe_value = 0.0
    @value = 0.0
    if element.present?
      @indivisual_jumps = element.split(/\+/).map {|d| IndivisualJump.new(d) }
      @base_value = @indivisual_jumps.sum {|j| j.base_value}
      @base_value *= 1.1 if credit
      highest_bv_jump = @indivisual_jumps.max {|a, b| a.base_value <=> b.base_value}
      @goe_value = highest_bv_jump.sovs[goe.to_i+3]
      @value = @base_value + @goe_value

    end

    @is_combination = @indivisual_jumps.size > 1
    @is_combination3 = @indivisual_jumps.size == 3
    @is_axel = (@indivisual_jumps.find {|j| j.is_axel}) ? true : false
  end
end
