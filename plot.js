// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 50},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


var R_mu = document.getElementById('R_mu').value
var R_sigma = document.getElementById('R_sigma').value
var raise_killing = document.getElementById('raise_killing').value
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
            .domain([0, 25])
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
  	    .attr("stroke", "#000")
  	    .attr("stroke-width", 1)
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
  	    .attr("stroke", "#000")
  	    .attr("stroke-width", 1)
  	    .attr("d",  d3.line()
  	        .x(function(d) { return x(d[0]); })
  	        .y(function(d) { return y(d[1]); })
  	    );
  }
};

d3.select("#R_mu").on("change", function(d){
	R_mu = this.value
	plot_pop(R_mu, R_sigma, raise_killing, n_patients)
})

d3.select("#R_sigma").on("change", function(d){
	R_sigma = this.value
	plot_pop(R_mu, R_sigma, raise_killing, n_patients)
})


d3.select("#raise_killing").on("change", function(d){
	raise_killing = this.value
	plot_pop(R_mu, R_sigma, raise_killing, n_patients)
}) 

d3.select("#n_patients").on("change", function(d){
	n_patients = this.value
	plot_pop(R_mu, R_sigma, raise_killing, n_patients)
})

function plot_pop(R_mu, R_sigma, raise_killing, n){
	console.log(R_mu)
	console.log(R_sigma)
	console.log(raise_killing)
	let death_times_treat = []
	let death_times_placebo = []
	
	function get_next_patient(){
		let d_treat = population_survival( R_mu, R_sigma, raise_killing, 1, 1 )
		death_times_treat.push( parseFloat(d_treat[0]) )

		let d_placebo = population_survival(R_mu, R_sigma, 1, 1, 1)
		death_times_placebo.push( parseFloat(d_placebo[0]) )
		//console.log( d )
	
		death_times_treat = death_times_treat.sort((a,b) => a - b)
		d1 = [[0,1]];
		for( let i = 0 ; i < death_times_treat.length ; i ++ ){
			d1.push( [death_times_treat[i],1-(i+1)/death_times_treat.length] )
		}
		
		death_times_placebo = death_times_placebo.sort((a,b) => a - b)
		d2 = [[0,1]];
		for( let i = 0 ; i < death_times_placebo.length ; i ++ ){
			d2.push( [death_times_placebo[i],1-(i+1)/death_times_placebo.length] )
		}
		plot(d1, d2);
		if( --n > 0 ){
			setTimeout( get_next_patient, 0 )
		} else {
			console.log( death_times_treat )
		}
	}
	get_next_patient()
}

plot_pop(R_mu, R_sigma, raise_killing, n_patients)
