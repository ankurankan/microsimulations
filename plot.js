// set the dimensions and margins of the graph

const MAX_X_VALUE = 25; // Max time in months to plot

var margin = {top: 30, right: 30, bottom: 30, left: 50},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


var R_mu = document.getElementById('R_mu').value
var R_sigma = document.getElementById('R_sigma').value
var raise_killing = document.getElementById('raise_killing').value
var chemo_effect = document.getElementById('chemo_effect').value / 10
var n_patients = document.getElementById('n_patients').value

var d1 = [[0,1], [10,.9], [20,.85]]

var svg = d3.select("#my_dataviz")
  	    .append("svg")
    	    .attr("width", width + margin.left + margin.right)
    	    .attr("height", height + margin.top + margin.bottom)
  	    .append("g")
    	    .attr("transform",
          	"translate(" + margin.left + "," + margin.top + ")");

function plot(data_placebo, data_treat) {
  // add the x Axis
  svg.selectAll("*").remove();
  var x = d3.scaleLinear()
            .domain([0, MAX_X_VALUE])
            .range([0, width]);
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // add the y Axis
  var y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 1.0]);
  svg.append("g")
      .call(d3.axisLeft(y));

  // Plot the area
  if (data_placebo != null){
  	var placebo = svg
  	  .append('g')
  	  .append("path")
  	    .attr("class", "mypath")
  	    .datum(data_placebo)
  	    .attr("fill", "none")
  	    .attr("stroke", "blue")
  	    .attr("stroke-width", 2)
	    .style("opacity", 0.6)
	    .transition()
  	    .attr("d",  d3.line()
  	        .x(function(d) { return x(d[0]); })
  	        .y(function(d) { return y(d[1]); })
  	    );
  }

  if (data_treat != null){
  	var treat = svg
  	  .append('g')
  	  .append("path")
  	    .attr("class", "mypath")
  	    .datum(data_treat)
  	    .attr("fill", "none")
  	    .attr("stroke", "red")
  	    .attr("stroke-width", 2)
	    .style("opacity", 0.6)
	    .transition()
  	    .attr("d",  d3.line()
  	        .x(function(d) { return x(d[0]); })
  	        .y(function(d) { return y(d[1]); })
  	    );
  }
};

d3.select("#R_mu").on("change", function(d){
	R_mu = this.value
	document.getElementById('R_mu_value').innerHTML = R_mu;
	plot_pop(R_mu, R_sigma, raise_killing, chemo_effect, n_patients);
})

d3.select("#R_sigma").on("change", function(d){
	R_sigma = this.value
	document.getElementById('R_sigma_value').innerHTML = R_sigma;
	plot_pop(R_mu, R_sigma, raise_killing, chemo_effect, n_patients);
})


d3.select("#raise_killing").on("change", function(d){
	raise_killing = this.value
	document.getElementById('imm_effect_value').innerHTML = raise_killing;
	plot_pop(R_mu, R_sigma, raise_killing, chemo_effect, n_patients);
})

d3.select("#chemo_effect").on("change", function(d){
	chemo_effect = this.value/10;
	document.getElementById('chemo_effect_value').innerHTML = chemo_effect;
	plot_pop(R_mu, R_sigma, raise_killing, chemo_effect, n_patients);
})

d3.select("#n_patients").on("change", function(d){
	n_patients = this.value
	document.getElementById('n_patients_value').innerHTML = n_patients;
	plot_pop(R_mu, R_sigma, raise_killing, chemo_effect, n_patients);
})

function plot_pop(R_mu, R_sigma, raise_killing, chemo_effect, n){
	let death_times_treat = [];
	let death_times_placebo = [];
	
	function get_next_patient(){
		let d_treat = population_survival( R_mu, R_sigma, raise_killing, chemo_effect, 1 );
		death_times_treat.push( parseFloat(d_treat[0]) );

		let d_placebo = population_survival(R_mu, R_sigma, 1, 1, 1);
		death_times_placebo.push( parseFloat(d_placebo[0]) );

		death_times_treat = death_times_treat.sort((a,b) => a - b);
		d1 = [[0,1]];
		for( let i = 0 ; i < death_times_treat.length ; i ++ ){
			if (death_times_treat[i] < MAX_X_VALUE){
				d1.push( [death_times_treat[i],1-(i+1)/death_times_treat.length] );
			}
		}
		d1.push([MAX_X_VALUE, array_sum(death_times_treat.map(i => i > MAX_X_VALUE? 1: 0))/death_times_treat.length]);
		
		death_times_placebo = death_times_placebo.sort((a,b) => a - b);
		d2 = [[0,1]];
		for( let i = 0 ; i < death_times_placebo.length ; i ++ ){
			if (death_times_placebo[i] < MAX_X_VALUE){
				d2.push( [death_times_placebo[i],1-(i+1)/death_times_placebo.length] );
			}
		}
		d2.push([MAX_X_VALUE, array_sum(death_times_placebo.map(i => i > MAX_X_VALUE? 1: 0))/death_times_placebo.length]);
		plot(d1, d2);
		if( --n > 0 ){
			setTimeout( get_next_patient, 0 );
		} else {
			console.log( death_times_treat );
		}
	}
	get_next_patient();
	return [death_times_treat, death_times_placebo];
}

[death_times_treat, death_times_placebo] = plot_pop(R_mu, R_sigma, raise_killing, chemo_effect, n_patients)
