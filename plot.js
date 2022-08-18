// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 50},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


var R_mu = document.getElementById('R_mu').value
var R_sigma = document.getElementById('R_sigma').value
var raise_killing = document.getElementById('raise_killing').value

var N = 100

//var d1 = prop_survival(R_mu, R_sigma, raise_killing, N)

var d1 = [[0,1], [10,.9], [20,.85]]

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  	    .append("svg")
    	    .attr("width", width + margin.left + margin.right)
    	    .attr("height", height + margin.top + margin.bottom)
  	    .append("g")
    	    .attr("transform",
          	"translate(" + margin.left + "," + margin.top + ")");

function plot(data) {
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
  var curve = svg
    .append('g')
    .append("path")
      .attr("class", "mypath")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("d",  d3.line()
          .x(function(d) { return x(d[0]); })
          .y(function(d) { return y(d[1]); })
      );
};

d3.select("#R_mu").on("change", function(d){
	R_mu = this.value
	new_data = prop_survival(R_mu, R_sigma, raise_killing, N)
	plot(new_data)
})

d3.select("#R_sigma").on("change", function(d){
	R_sigma = this.value
	new_data = prop_survival(R_mu, R_sigma, raise_killing, N)
	plot(new_data)
})


d3.select("#raise_killing").on("change", function(d){
	raise_killing = this.value
	new_data = prop_survival(R_mu, R_sigma, raise_killing, N)
	plot(new_data)
}) 

let n_left = 500;
let death_times = []

function get_next_patient(){
	let d = population_survival( R_mu, R_sigma, raise_killing, 1 )
	death_times.push( parseFloat(d[0]) )
	//console.log( d )

	death_times = death_times.sort((a,b) => a - b)
	d1 = [[0,1]];
	for( let i = 0 ; i < death_times.length ; i ++ ){
		d1.push( [death_times[i],1-(i+1)/death_times.length] )
	}
	plot(d1);
	if( --n_left > 0 ){
		setTimeout( get_next_patient, 0 )
	} else {
		console.log( death_times )
	}
}


get_next_patient()
