################################################################
class Parser
  def parse(params)

    jumps = []
    total_base_value = 0.0
    tes = 0.0
    num_jumps = (params[:segment]  != "FS") ? 3 : (params[:category] == "MEN") ? 8 : 7
    
    1.upto(num_jumps).each do |i|
      if element = params["jump#{i}_element"]
        jumps[i] = Jump.new(element,
                            credit: (params["jump#{i}_credit"] == "on") ? true : false,
                            goe: params["jump#{i}_goe"].to_i || 0)

        total_base_value += jumps[i].base_value

        tes += jumps[i].value
      end
    end

    score = {
      tes: tes,
      total_base_value: total_base_value,
      num_jumps: num_jumps,
      
      elements: {
        jumps: jumps,
      }
    }
  end

  def validate(score, category=nil, segment=nil)
    category ||= "MEN"
    segment ||= "SP"

    validity = true
    limits = {
      "MEN" => {
        "SP" => [3, 1, 0, 1],
        "FS" => [8, 3, 1, 2],
      },
      "LADIES" => {
        "SP" => [3, 1, 0, 1],
        "FS" => [7, 3, 1, 2],
      },
    }

    limit = {
      num_jumps: limits[category][segment][0],
      num_combination: limits[category][segment][1],
      num_combination3: limits[category][segment][2],
      num_axel: limits[category][segment][3],
    }

    num_jumps = 0
    num_combination = 0
    num_combination3 = 0
    num_axel = 0
    normalized_jumps = {}
    double_jumps = {}

    ## jumps
    score[:elements][:jumps].each do |jump|
      next if jump.nil?

      jump.validity = true

      ## number of comb/jumbs
      num_jumps += 1
      num_combination +=1 if jump.is_combination
      num_combination3 +=1 if jump.is_combination3
      num_axel += 1 if jump.is_axel

      if num_jumps > limit[:num_jumps]
        jump.comment = "num jumps limit over"
        jump.validity = false
      elsif jump.is_combination && num_combination > limit[:num_combination]
        jump.comment = "num comb jumps limit over"
        jump.validity = false
      elsif jump.is_combination3 && num_combination3 > limit[:num_combination3]
        jump.comment = "num comb3 jumps limit over"
      elsif jump.is_axel && num_axel > limit[:num_axel]
        jump.comment = "axel limit over"
        jump.validity = false
      else

      end

      if segment == "SP"
        ## combination
        if jump.is_combination3
          jump.comment = "comb3 not allowed"
          jump.validity = false
          jump.base_value = 0
          jump.value = 0
        end
      elsif segment == "FS"
        ## zayak
        jump.indivisual_jumps.each do |n_jump|
          normalized_jumps[n_jump] = normalized_jumps[n_jump].to_i + 1

          if normalized_jumps[n_jump] > 2
            jump.comment = "num same jump limit over"
            jump.validity = false
          elsif normalized_jumps.select {|_, v| v >=2 }.keys.size > 2
            jump.comment = "zayak"
            jump.validity = false
          end
        end

        ## double jump limit
        jump.indivisual_jumps.each do |n_jump|
          if n_jump =~ /^2/
            double_jumps[n_jump] = double_jumps[n_jump].to_i + 1

            if double_jumps[n_jump] > 2
              jump.comment = "double jump limit over"
              jump.validity = false
            end
          end
        end
      end
    end

    ## must include axel
    if score[:elements][:jumps].compact.select {|j| j.is_axel}.size == 0
      num_jumps.downto(1) do |i|
        if jump = score[:elements][:jumps][i]
          jump.comment = "axel required"
          jump.validity = false
          break
        end
      end
    end
  end

end  
  
