// Set defaults 
var focused = false,
    ortho = true, 
    sens = 0.25,
    margin = {top: 10, left: 10, bottom: 10, right: 10},
    width = parseInt(d3.select('#map').style('width')),
    width = width - margin.left - margin.right,
    mapRatio = 0.9,
    height = width * mapRatio,
    active = d3.select(null);

// Create map projection 
var projection = d3.geoOrthographic()
    .scale(width/2)
    .rotate([-15, 0])
    .translate([width / 2, height / 3])
    .clipAngle(90);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var infoLabel = d3.select("#map").append("div").attr("id", "infoLabel");

var g = svg.append("g")
    .style("stroke-width", "1.5px");

// Queue external map data
d3.queue()
    .defer(d3.json, "data/world-110m.v1.json")
    .defer(d3.tsv, "data/world-110m.v1.tsv")
    .defer(d3.tsv, "data/world-iso_a2.tsv")
    .await(ready)

d3.select(window).on("resize", resize);

// Event handler to adjust map when the window size changes
function resize() {
    width = parseInt(d3.select('#map').style('width'));
    width = width - margin.left - margin.right;
    height = width * mapRatio;

    // Update projection
    projection
        .scale([width/2])
        .translate([width /2, height / 3]);
  
    // Resize map container
    d3.select("#map").attr("width",width).attr("height",height);
    d3.select("svg").attr("width",width).attr("height",height);  
    d3.selectAll("path").attr('d', path);
}

function ready(error, world, countryData, iso_a2Data) {
    if (error) throw error;
    
    var countryById = {},
        iso_a2ById = {},
        countries = topojson.feature(world, world.objects.countries).features;

    // Add countries by name
    countryData.forEach(function(d) {
        countryById[d.iso_n3] = d.geounit;
    });

    // Add iso_a2 codes 
    iso_a2Data.forEach(function(d) {
        iso_a2ById[d.id] = d.iso_a2;
    });

    // Fill oceans
    g.append("path")
        .datum({type: "Sphere"})
        .attr("class", "water")
        .attr("d", path);

    // Draw countries on the globe
    var world = g.selectAll("path")
        .data(countries)
        .enter().append("path")
        .attr("overflow", "hidden")
        .attr("class", "mapData")
        .attr("d", path)
        .classed("ortho", ortho = true)

    // Event handlers 
    world.on("mouseover", function(d) {

    })
    .on("mouseout", function(d) {

    })
    .on("resize", resize)
    .on("click", function(d) {        
        if (focused === d) return reset();
        g.selectAll(".focused").classed("focused", false);
        d3.select(this).classed("focused", focused = d);

        country = countryById[d.id]
        iso_a2 = iso_a2ById[d.id]
        
        // Display infoLabel
        infoLabel.text(country)
        .style("display", "inline");

        var infoBox = document.getElementById('infoLabel');
        // Display associated country flag
        if ( iso_a2 !== 'undefined' && typeof(iso_a2) === 'string' ) {
            var infoSpan = '<span class="flag-icon flag-icon-' + iso_a2.toLowerCase(iso_a2) + ' flag-icon-squared"></span>';
            infoBox.innerHTML += (infoSpan);
        }

        var infoContent = document.createElement('p');
        infoBox.appendChild(infoContent); // Append new element for content
        infoContent.setAttribute("class", "countryDetail");

        // Clicked on feature
        var p = d3.geoCentroid(d);
        
        // Store the current rotation and scale
        var currentRotate = projection.rotate();
        var currentScale = projection.scale();
        
        // Calculate the future bounding box after applying a rotation
        projection.rotate([-p[0], -p[1]]);
        path.projection(projection);
        
        // calculate the scale and translate required
        var b = path.bounds(d);
        var nextScale = currentScale * 1 / Math.max((b[1][0] - b[0][0]) / (width/3), (b[1][1] - b[0][1]) / (height/3));
        var nextRotate = projection.rotate();

        // Update the map
        d3.selectAll("path")
        .transition()
        .attrTween("d", function(d) {
            var r = d3.interpolate(currentRotate, nextRotate);
            var s = d3.interpolate(currentScale, nextScale);
                return function(t) {
                    projection
                        .rotate(r(t))
                        .scale(s(t));
                    path.projection(projection);
                    return path(d);
                }
         })
         .duration(1000);

         fetchAPIData(country);
        
    });

    // Drag event - simpler without? 
    world.call(d3.drag()
        .subject(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
        .on("drag", function() {
            var lamda = d3.event.x * sens,
            phi = -d3.event.y * sens,
            rotate = projection.rotate();

            //Set limits for rotation
            phi = phi > 20 ? 20 :
            phi < -20 ? -20 :
            phi;
            // lamda = lamda > 10 ? 10 :
            // lamda < -10 ? -10 :
            // lamda;
            projection.rotate([lamda, phi]);
            g.selectAll("path.ortho").attr("d", path);
            g.selectAll(".focused").classed("focused", focused = false);
        })
    )

    // Add extra data when focused
    function focus(d) {
        if (focused === d) return reset();
        g.selectAll(".focused").classed("focused", false);
        d3.select(this).classed("focused", focused = d);
    }

    // Reset view when focus country is clicked
    function reset() {
        active.classed("focused", false);
        active = d3.select(null);
        
        g.selectAll(".focused").classed("focused", focused = false);
        infoLabel.style("display", "none");

        d3.selectAll("path")
            .transition()
            .attrTween("d", function(d) {
            var r = d3.interpolate(projection.rotate(), [-15, 0]);
            var s = d3.interpolate(projection.scale(), width/2);
                return function(t) {
                    projection
                        .scale(s(t))
                        .rotate(r(t));
                    path.projection(projection);
                    return path(d);
                }
           })
          .duration(1500);
    }

};

// Queries the API with user inputs 
function fetchAPIData() {

    // Get country focus
    g.selectAll(".focused").classed("focused", false);

    // Set defaults 
    var limit = 5000;
    var status = "r_fundraising";
    var statusDesc = "Fundraising";
    var stage = "Start-up";

    // Fetch select values 
    var e = document.getElementById('status');
    var status = e.options[e.selectedIndex].value;
    var statusDesc = e.options[e.selectedIndex].text;

    var e = document.getElementById('stage');
    var stage = e.options[e.selectedIndex].value;
    var stageDesc = e.options[e.selectedIndex].text;

    var e = document.getElementById('sector');
    var sector = e.options[e.selectedIndex].value;
    var sectorDesc = e.options[e.selectedIndex].text;
   
    console.log('g = ' + g);
    console.log('country = ' + country);

    // Load parameters
    var data = { "limit": limit,
        "country": country,
        "status": status
    }
    if (stage !== 'all') { data.stage = stage }
    if (sector !== 'all') { data.sector = sector }

     // Fetch data from API
    $.ajax({
        dataType: "json",
        url: "https://api.vc4a.com/v1/fundraising/search.json",
        type: "GET",
        data: data,
        success: function (data) {
            var total = 0;
            var venturesCount = 0;
            $.each(data, function() {
                $.each(this, function() {
                  if (typeof this.capital !== 'undefined') { 
                      for(var i=0;i<this.capital.length;i++) {
                          if (typeof this.capital[i].stage !== 'undefined') {
                              total += Number(this.capital[i].amount); 
                              venturesCount++;                                   
                          }
                      }
                  }
                });
            });

            // Prepare country detail output 
            var totalCap = total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            var infoBox = document.getElementById('infoLabel');
            var infoContent = infoBox.getElementsByClassName('countryDetail')[0];
            var capText = '<b>' + venturesCount + '</b> ventures currently ' + statusDesc + '<br />';
                capText += 'Financing Stage: ' + stageDesc + '<br />';
                capText += 'Sector: ' + sectorDesc + '<br />'
                capText += 'Total Capital: <b>USD $' + totalCap + '</b><br />';
                capText += 'Explore these ventures on <a href="https://vc4a.com/ventures/country/' + country + '/?base_country%5B%5D=' + country + '&mode=fundraising&o=trending&search=1">VC4A.com</a><br /><br />';
                capText += 'Get detailed financials with a VC4A <a href="https://vc4a.com/pro/">Pro</a> or <a href="https://vc4a.com/research/">Research</a> account.<br />';
            infoContent.innerHTML = capText;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
}

$(document).ready(function(){
    // Populate sector select options from API
    $.ajax({
        dataType: "json",
        url: "https://api.vc4a.com/v1/ventures/sectors.json",
        type: "GET",
        success: function (data) {
            $.each(data, function() {
                $.each(this, function() {
                    if (typeof this !== 'undefined') {
                        var optionItem = this.toString();
                            optionItem = optionItem.split(' ').slice(0,4).join(' ');
                        $("#sector").append('<option value="' + this + '">' + optionItem + '</option>');
                    }
                });
            });
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
});  
