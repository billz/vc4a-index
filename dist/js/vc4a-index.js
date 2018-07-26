// Set defaults 
var focused = false,
    ortho = true,
    sens = 0.15,
    margin = {top: 60, left: 0, bottom: 0, right: 0},
    width = parseInt(d3.select('#map').style('width')) - margin.left - margin.right,
    scaleFactor = 1.8,
    height = $(window).height();

active = d3.select(null);

// Create map projection 
var projection = d3.geoOrthographic()
    .scale(width / scaleFactor)
    .rotate([-15, -15])
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
    .defer(d3.tsv, "data/vc4a-cache.tsv")
    .await(ready);

d3.select(window).on("resize", resize);

// Event handler to adjust map when the window size changes
function resize() {
    width = parseInt(d3.select('#map').style('width'));
    width = width - margin.left - margin.right;
    height = $(window).height();

    // Update projection
    projection
        .scale([width / scaleFactor])
        .translate([width / 2, height / 3]);

    // Resize map container
    d3.select("#map").attr("width", width).attr("height", height);
    d3.select("svg").attr("width", width).attr("height", height);
    d3.selectAll("path").attr('d', path);
}

function ready(error, world, countryData, iso_a2Data, financeData) {
    if (error) throw error;

    // Define constants
    const colorVariable = 'totalCap';
    const geoIDVariable = 'id';
    const color = d3.scaleQuantile()
        .range([
            'rgb(197, 225, 196)',
            'rgb(179, 216, 178)',
            'rgb(162, 207, 161)',
            'rgb(145, 198, 144)',
            'rgb(128, 189, 127)',
            'rgb(111, 181, 110)',
            'rgb(94, 172, 93)',
            'rgb(77, 163, 76)',
            'rgb(60, 154, 59)',
            'rgb(43, 146, 42)'
        ]);

    var countryById = {},
        iso_a2ById = {},
        financeById = {},
        vc4aCountries = {},
        countries = topojson.feature(world, world.objects.countries).features;

    // Add countries by name
    countryData.forEach(function (d) {
        countryById[d.iso_n3] = d.geounit;
    });

    // Add iso_a2 codes 
    iso_a2Data.forEach(function (d) {
        iso_a2ById[d.id] = d.iso_a2;
    });

    // Add vc4a countries, financials by country
    financeData.forEach(function (d) {
        financeById[d.id] = d.totalCap;
        vc4aCountries[d.id] = d.country;
    });

    /**
      * The Ckmeans algorithm from the simple-statistics package is used to cluster our data.
      * The minimum value of each cluster is defined as a break. We then use these breaks with a quantile scale 
      * to map values in the data to colors on the choropleth map.
      *
      * @see https://simplestatistics.org/docs/#ckmeans
    */
    const numberOfClasses = color.range().length - 1;
    const ckmeansClusters = ss.ckmeans(financeData.map(d => d[colorVariable]), numberOfClasses);
    const ckmeansBreaks = ckmeansClusters.map(d => d3.min(d));
    console.log('numberOfClasses', numberOfClasses);
    console.log('ckmeansClusters', ckmeansClusters);
    console.log('ckmeansBreaks', ckmeansBreaks);

    // Sets the domain of the color scale based on our data
    color
        .domain(ckmeansBreaks);

    // Fill oceans
    g.append("path")
        .datum({type: "Sphere"})
        .attr("class", "water")
        .attr("d", path);

    // Draw countries on the globe
    world = g.selectAll("path")
        .data(countries)
        .enter().append("path")
        .attr("overflow", "hidden")
        .attr("class", function(z) {
            if( vc4aCountries.hasOwnProperty(z.id) ) {
                return 'mapData'+ ( vc4aCountries.hasOwnProperty(z.id) ? ' hasData' : '');
            }
        })
        .style('fill', d => {
            if (typeof financeById[d.id] !== 'undefined') {
                return color(financeById[d.id])
            }
            return 'darkgrey'
        })
        .attr("d", path)
        .classed("ortho", ortho = true)

    // Event handlers 
    //world.on("mouseover", function (d) {});
    //world.on("mouseout", function (d) {});
    world.on("click", function (d) {
        if (focused === d) return reset();
        g.selectAll(".focused").classed("focused", false);
        d3.select(this).classed("focused", focused = d);

        country = countryById[d.id];
        iso_a2 = iso_a2ById[d.id];

        // Display infoLabel
        infoLabel.text(country)
            .style("display", "inline");

        // Display associated country flag
        var infoBox = document.getElementById('infoLabel');
        if (iso_a2 !== 'undefined' && typeof(iso_a2) === 'string') {
            var infoSpan = '<span class="flag-icon flag-icon-' + iso_a2.toLowerCase(iso_a2) + ' flag-icon-squared"></span>'
                + '<button type="button" class="close float-right" aria-label="Close" onClick="reset()"><span aria-hidden="true">&times;</span></button>';
            infoBox.innerHTML += (infoSpan);
        }

        // Append new element to display content
        var infoContent = document.createElement('p');
        infoBox.appendChild(infoContent);
        infoContent.setAttribute("class", "countryDetail");
        infoContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading ...';

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
        var nextScale = currentScale * 1 / Math.max((b[1][0] - b[0][0]) / (width / 1.5), (b[1][1] - b[0][1]) / (height / 2));
        var nextRotate = projection.rotate();

        // Update the map
        d3.selectAll("path")
            .transition()
            .attrTween("d", function (d) {
                var r = d3.interpolate(currentRotate, nextRotate);
                var s = d3.interpolate(currentScale, nextScale);
                return function (t) {
                    projection
                        .rotate(r(Math.pow(t, 0.33)))
                        .scale(currentScale > nextScale
                            ? s(Math.pow(t, 0.1))
                            : s(Math.pow(t, 3))
                        );
                    path.projection(projection);
                    return path(d);
                }
            })
            .duration(750);

        fetchAPIData();
    });

    world.on("resize", resize);

    // Drag event - simpler without?
    world.call(d3.drag()
        .subject(function () {
            var r = projection.rotate();
            return {x: r[0] / sens, y: -r[1] / sens};
        })
        .on("drag", function () {
            var lamda = d3.event.x * sens,
                phi = -d3.event.y * sens,
                rotate = projection.rotate();

            // Define limits for rotation
            phi = phi > 20 ? 20 :
                phi < -20 ? -20 :
                    phi;
            projection.rotate([lamda, phi]);
            g.selectAll("path.ortho").attr("d", path);
            g.selectAll(".focused").classed("focused", focused = false);
        })
    );

    // Add extra data when focused
    function focus(d) {
        if (focused === d) return reset();
        g.selectAll(".focused").classed("focused", false);
        d3.select(this).classed("focused", focused = d);
    }
}

// Queries the API with user inputs, displays output in country detail box 
function fetchAPIData() {

    // Set defaults 
    var limit = 5000;

    // Fetch select option values
    var $e = $('input[name=status]:checked'),
        status = $e.val(),
        statusDesc = $e.data('text');

    var st = document.getElementById('stage'),
        stage = st.options[st.selectedIndex].value,
        stageDesc = st.options[st.selectedIndex].text;

    var s = document.getElementById('sector'),
        sector = s.options[s.selectedIndex].value,
        sectorDesc = s.options[s.selectedIndex].text;

    // Load parameters
    var data = {
        "limit": limit,
        "country": typeof country === 'undefined' ? null : country,
        "status": status
    };

    if (stage !== 'all') {
        data.stage = stage
    }
    if (sector !== 'all') {
        data.sector = sector
    }

    // Prepare Ajax request
    $.ajax({
        dataType: "json",
        url: "https://api.vc4a.com/v1/fundraising/trends.json",
        type: "GET",
        data: data,
        success: function (data) {
            var total = 0;
            var venturesCount = 0;
            $.each(data, function () {
                $.each(this, function () {
                    if (typeof this.capital !== 'undefined') {
                        for (var i = 0; i < this.capital.length; i++) {
                            if (typeof this.capital[i].stage !== 'undefined') {
                                total += Number(this.capital[i].amount);
                                venturesCount++;
                            }
                        }
                    }
                });
            });

            // Prepare country detail output 
            var totalCap = total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
                infoBox = document.getElementById('infoLabel'),
                infoContent = infoBox.getElementsByClassName('countryDetail')[0];

            // Update content of country detail info box
            infoContent.innerHTML = '<b>' + venturesCount + '</b> ventures currently ' + statusDesc + '<br />'
                + 'Financing Stage: ' + stageDesc + '<br />'
                + 'Sector: ' + sectorDesc + '<br />'
                + 'Total Capital: <b>USD $' + totalCap + '</b><br />'
                + 'Explore these ventures on <a href="https://vc4a.com/ventures/country/' + country + '/?base_country%5B%5D=' + country + '&mode=fundraising&o=trending&search=1">VC4A.com</a><br /><br />'
                + 'Get detailed financials and expert analysis with a VC4A <a href="https://vc4a.com/pro/">Pro</a> or <a href="https://vc4a.com/research/">Research</a> account.<br />';
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
}

// Reset view when focus country is clicked
function reset() {
    active.classed("focused", false);
    active = d3.select(null);

    g.selectAll(".focused").classed("focused", focused = false);
    infoLabel.style("display", "none");

    d3.selectAll("path")
        .transition()
        .attrTween("d", function (d) {
            var r = d3.interpolate(projection.rotate(), [-15, -15]);
            var s = d3.interpolate(projection.scale(), width / scaleFactor);
            return function (t) {
                projection
                    .scale(s(t))
                    .rotate(r(t));
                path.projection(projection);
                return path(d);
            }
        })
        .duration(1500);
}

$(document).ready(function () {
    // Populate sector select option values from API
    $.ajax({
        dataType: "json",
        url: "https://api.vc4a.com/v1/ventures/sectors.json",
        type: "GET",
        success: function (data) {
            $.each(data, function () {
                $.each(this, function () {
                    if (typeof this !== 'undefined') {
                        $("#sector").append('<option value="' + this + '">'
                            + this.toString().split(' ').slice(0, 4).join(' ')
                            + '</option>'
                        );
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
