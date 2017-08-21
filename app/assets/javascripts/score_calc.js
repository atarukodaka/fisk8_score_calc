/* Element */
var Element = function(element, goe){
    this.element = element;
    this.goe = goe;
    this.invalid = false;
    this.comment = "";
    this.base_value = function(){
	if (this.element == "" || this.invalid){ return 0 }
	return parseFloat(bvsov[this.element].bv);
    }
    this.goe_value = function(){
	if (this.element == "" || this.invalid ){ return 0 }
	return bvsov[this.element].sov[this.goe]
    }
    this.value = function(){
	if (this.element == "" || this.invalid ){ return 0 }
	return this.base_value() + this.goe_value();
    }
    this.validated_element = function(){
	return this.element + ((this.invalid) ? "*" : "")
    }

}

var IndivisualJump  = function(element, goe){
    this.underrotated = false;
    this.downgraded = false;
    this.seq = false;

    element.match(/^(\d)([A-Z][a-z]*)/)
    this.element = element;
    this.rotation = parseInt(RegExp.$1);
    this.type = RegExp.$2;

    if (element.match(/\!/)){
	this.edge_error = true;
    }
    if (element.match(/(<+)/)){
	if (RegExp.$1 == '<'){
	    this.underrotated = true;
	} else {
	    this.downgraded = true;
	}
    }
    this.normalized_jump = this.rotation + this.type;

    this.base_value = function(){
	if (this.normalized_jump == "" || this.invalid){
	    return 0
	}
	var bv = 0;
	if (this.downgraded){
	    if (this.rotation == 1){
	    } else {
		downgraded_rotation = this.rotation - 1;
		downgraded_jump = downgraded_rotation + this.type
		if (this.edge_error){
		    bv = parseFloat(bvsov[downgraded_jump].v);
		} else {
		    bv = parseFloat(bvsov[downgraded_jump].bv);
		}
	    }
	} else {
	    if (this.edge_error && this.underrotated){
		bv = parseFloat(bvsov[this.normalized_jump].v1);
	    } else if (this.edge_error || this.underrotated){
		bv = parseFloat(bvsov[this.normalized_jump].v);
	    } else {
		bv = parseFloat(bvsov[this.normalized_jump].bv);
	    }
	}
	if (this.seq){
	    bv *= 0.7
	}
	return bv
    }
    this.is_axel = function(){
	return this.type == "A"
    }
}
IndivisualJump.prototype = new Element();

var Jump = function(element, goe, credit){
    this.goe = goe;
    this.credit = credit;
    this.element = element;
    this.credit = credit;
    this.is_combination = false
    this.is_combination3 = false
    
    var i_jumps = [];
    var i = 1;
    if (element != ""){
	ary = element.split("+");
	ary.forEach(function(val, index, ar){
	    /* this.indivisual_jumps[i] = new IndivisualJump(val); */
	    i_jumps[i] = new IndivisualJump(val);
	    i = i + 1;
	});
    }
    this.indivisual_jumps = i_jumps;
    if (this.indivisual_jumps.length > 2){
	this.is_combination = true
    }
    if (this.indivisual_jumps.length > 3){
	this.is_combination3 = true
    }
    this.base_value = function(){
	if (this.invalid){ return 0 }
	var bv = 0;
	this.indivisual_jumps.forEach(function(ind_jump, index, ar){
	    bv += ind_jump.base_value();
	});
	if (this.credit){
	    bv *= 1.1
	}
	return bv;
    }
    this.goe_value = function(){
	if (this.invalid){ return 0 }
	if (this.element == ""){
	    return 0;
	}
	var highest_bv_jump = undefined;
	var max_bv = 0;
	this.indivisual_jumps.forEach(function(val, index, ar){
	    if (max_bv < val.base_value()){
		highest_bv_jump = val
		max_bv = val.base_value();
	    }
	});
	if (highest_bv_jump == undefined){
	    return 0
	} else {
	    return bvsov[highest_bv_jump.normalized_jump].sov[this.goe]
	}
    }
    this.validated_element = function(){

	if (this.indivisual_jumps[1]){
	    var v_elem = this.indivisual_jumps[1].validated_element()
	    
	    for(i=2; i<=3; i++){
		element = this.indivisual_jumps[i]
		if (element != undefined){
		    v_elem += "+" + element.validated_element()
		}
	    }
	    return v_elem + ((this.invalid) ? "*" : "")
	} else {
	    return undefined
	}
    }
    this.is_axel = function(){
	flag = false
	this.indivisual_jumps.forEach(function(jump, index, ar){
	    if (jump.is_axel()){
		flag = true
	    }
	})
	return flag
    }
}
Jump.prototype = new Element();

var Spin = function(element, goe){
    Element.call(this, element, goe);
}
Spin.prototype = new Element();

var Step = function(element, goe){
    Element.call(this, element, goe);
}
Step.prototype = new Element();


/* **************************************************************** */
var ScoreCalc = function(){
    this.jumps = [];
    this.spins = []
    this.steps = []
    this.total_base_value = 0;
    this.tes = 0;

    this.recalc = function(){
	this.category = $('#category').val() || "MEN";
	this.segment = $('#segment').val() || "SP";

	this.num_spins = 3;
	if (this.segment == "SP"){
	    this.num_jumps = 3;
	    this.num_steps = 1;
	} else {
	    if (this.category == "MEN"){
		this.num_jumps = 8
	    } else {
		this.num_jumps = 7;
	    }
	    this.num_steps = 2;
	}

	var total_base_value = 0;
	var tes = 0;

	/*  jump */
	for(i=1; i<=this.num_jumps; i++){
	    var element = $('#jump' + i + "_element").val();
	    var goe= $('#jump' + i + "_goe").val();
	    var credit = $('#jump' + i + "_credit").prop('checked')
	    jump = new Jump(element, goe, credit)
	    this.jumps[i] = jump

	    total_base_value += jump.base_value();
	    tes += jump.value();
	}
	/* spin */
	for(i=1; i<=this.num_spins; i++){
	    var element = $('#spin' + i + "_element").val();
	    var goe= $('#spin' + i + "_goe").val();
	    spin = new Spin(element, goe)
	    this.spins[i] = spin

	    total_base_value += spin.base_value();
	    tes += spin.value();
	}
	/* step */
	for(i=1; i<=this.num_steps; i++){
	    var element = $('#step' + i + "_element").val();
	    var goe= $('#step' + i + "_goe").val();
	    step = new Step(element, goe)
	    this.steps[i] = step

	    total_base_value += step.base_value();
	    tes += step.value();
	}
	 

	this.total_base_value = total_base_value;
	this.tes = tes;

	this.validate()
	this.refresh();
    }
    /* **************************************************************** */
    this.validate = function(){

	if (this.segment == "SP"){
	    var i_combination = 0;

	    this.jumps.forEach(function(jump, index, ar){
		if (jump.is_combination3){
		    jump.indivisual_jumps[3].invalid = true;
		    jump.comment = "invalid: comb3 in SP"
		} else if (jump.is_combination){
		    i_combination += 1
		    if (i_combination > 1){
			jump.indivisual_jumps[2].invalid = true
		    }
		}
	    })
	    /* repetation check */
	    var repeated_jumps = {}
	    this.jumps.forEach(function(jump, index, ar){
		jump.indivisual_jumps.forEach(function(i_jump, index, ar){
		    t = repeated_jumps[i_jump.normalized_jump] || 0
		    repeated_jumps[i_jump.normalized_jump] = t + 1

		    if (repeated_jumps[i_jump.normalized_jump] > 1){
			console.log(index)
			if (index == 2 && jump.indivisual_jumps[1].normalized_element == jump.indivisual_jumps[2].normalized_element){
			} else {
			    i_jump.invalid = true
			}
		    }
		})
	    })
	    /* combination type check */
	    this.jumps.forEach(function(jump, index, ar){
	      if (jump.is_combination){
		  /* all more than double */
		if (jump.indivisual_jumps[1].rotation < 2 || jump.indivisual_jumps[2].rotation <2){
		    console.log("need more than double as combination")
		    jump.invalid = true
		} else {
		    sum_rotations = jump.indivisual_jumps[1].rotation + jump.indivisual_jumps[2].rotation
		    console.log(sum_rotations)
		    if (this.category == "MEN"){
			if (sum_rotations < 5){
			    console.log("need more rotation: " + sum_rotations)
			}
		    } else {  /* LADIES */
			if (sum_rotations != 5 && sum_rotations != 6){
			    console.log("rotation error: " + sum_rotations)
			    jump.invalid = true;
			}
		    }
		}
	      }
	    })
	} else {  /* FS */
	    var tripple_jumps = {}
	    var double_jumps = {}
	    var i_comb3 = 0;
	    
	    this.jumps.forEach(function(jump, index, ar){
		/* comb3 check */
		if (jump.is_combination3){
		    console.log("comb3")
		    i_comb3++
		    if (i_comb3 > 1){
			console.log("comb3 over")
			jump.indivisual_jumps[3].invalid = true
		    }
		}
		    
		jump.indivisual_jumps.forEach(function(i_jump, index, ar){
		    n_jump = i_jump.normalized_jump
		    if (i_jump.rotatino >= 3){
			tripple_jumps[n_jump] = (tripple_jumps[n_jump] || 0) + 1
			if (tripple_jumps[n_jump] > 2){
			    console.log("# comb > 2")
			    i_jump.invalid = true;
			}
			var i_more_than2 = 0;
			for(key in tripple_jumps){
			    if (tripple_jumps[key] > 1){
				i_more_than2++
				if (key == n_jump && i_more_than2 > 2){
				    console.log("tripple twice over")
				    i_jump.invalid = true
				}
			    }
			}
		    } else if (i_jump.rotation == 2){
			double_jumps[n_jump] = (double_jumps[n_jump] || 0) + 1
			for(key in double_jumps){
			    if (double_jumps[key] > 2 && key == n_jump){
				console.log("double jump twice over")
				i_jump.invalid = true
			    }
			}
		    }
		})
	    })
	}
	/* axel check */
	var i_axel = 0
	this.jumps.forEach(function(jump, index, ar){
	    if (jump.is_axel()){
		i_axel += 1
	    }
	})
	if (i_axel == 0){
	    if (this.jumps[this.num_jumps] != undefined){
		this.jumps[this.num_jumps].invalid = true
		this.jumps[this.num_jumps].comment = "axel required"
	    }
	}
	
    }
    this.refresh = function(){
	for(i=1; i<=this.num_jumps; i++){
	    jump = this.jumps[i];
	    $('#jump' + i).show()
	    $("#jump" + i + "_base_value").text(jump.base_value().toFixed(2));
	    $("#jump" + i + "_goe_value").text(jump.goe_value().toFixed(2));
	    $("#jump" + i + "_value").text(jump.value().toFixed(2));
	    $("#jump" + i + "_validated_element").text(jump.validated_element());
	    $("#jump" + i + "_comment").text(jump.comment);
	}
	for (i=this.num_jumps+1; i<=8; i++){
	    $('#jump' + i).hide()
	}
	
	for(i=1; i<=this.num_spins; i++){
	    spin = this.spins[i];
	    $("#spin" + i + "_base_value").text(spin.base_value().toFixed(2));
	    $("#spin" + i + "_goe_value").text(spin.goe_value().toFixed(2));
	    $("#spin" + i + "_value").text(spin.value().toFixed(2));
	}
	for(i=1; i<=this.num_steps; i++){
	    step = this.steps[i];
	    $('#step' + i).show();
	    $("#step" + i + "_base_value").text(step.base_value().toFixed(2));
	    $("#step" + i + "_goe_value").text(step.goe_value().toFixed(2));
	    $("#step" + i + "_value").text(step.value().toFixed(2));
	}
	for (i=this.num_steps+1; i<=2; i++){
	    $('#step' + i).hide()
	}
	

	$("#total_base_value").text(this.total_base_value.toFixed(2));
	$('#tes').text(this.tes.toFixed(2));
    }
}


