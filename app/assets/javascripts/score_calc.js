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
	return this.base_value() + this.goe_value();
    }

}

var IndivisualJump  = function(element, goe){
    this.underrotated = false;
    this.downgraded = false;
    this.seq = false;

    element.match(/^(\d)([a-zA-Z]+)/)
    this.element = element;
    this.rotation = RegExp.$1;
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
}


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
	if (this.element == ""){
	    return 0;
	}
	var highest_bv_jump = false;
	var max_bv = 0;
	this.indivisual_jumps.forEach(function(val, index, ar){
	    if (max_bv < val.base_value()){
		highest_bv_jump = val
		max_bv = val.base_value();
	    }
	});
	return bvsov[highest_bv_jump.normalized_jump].sov[this.goe]
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
	console.log("recalc")
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
    this.validate = function(){
	var repeated_jumps = {}
	var i_axel = 0

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
			jump.indivisual_jumps[1].seq = true
			jump.comment = "+SEQ"
		    }
		}
	    })

	} else {
	    
	}
	/* axel check */
	
    }
    this.refresh = function(){
	for(i=1; i<=this.num_jumps; i++){
	    jump = this.jumps[i];
	    $('#jump' + i).show()
	    $("#jump" + i + "_base_value").text(jump.base_value().toFixed(2));
	    $("#jump" + i + "_goe_value").text(jump.goe_value().toFixed(2));
	    $("#jump" + i + "_value").text(jump.value().toFixed(2));
	    $("#jump" + i + "_comment").text(jump.comment);
	}
	console.log(this.num_jumps)
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


