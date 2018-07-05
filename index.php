<!DOCTYPE html>
<head>
<title>VC4A Index (Beta)</title>
</head>
<meta charset="utf-8">
<body>
    <script src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.3/d3.min.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/topojson/1.6.9/topojson.min.js"></script>
    <script src="node_modules/datamaps/dist/datamaps.world.min.js"></script>
    <div id="container" style="position: relative; width: 90%; max-height: 450px;"></div>
    <script>
        //basic map config with custom fills, mercator projection
        var map = new Datamap({
            scope: 'world',
            geographyConfig: {
                popupOnHover: true,
                highlightOnHover: true,
                borderColor: '#444',
                borderWidth: 0.5,
            },
            element: document.getElementById('container'),
            projection: 'mercator',
            height: 600,
            width: null,
            responsive: true,
            fills: {
                defaultFill: '#dddddd',
                major: '#34b233',
                medium: '#0fa0fa',
                minor: '#bada55'
        },
        geographyConfig: {
            dataUrl: null, //if not null, datamaps will fetch the map JSON (currently only supports topojson)
            borderWidth: 1,
            borderOpacity: 1,
            borderColor: '#FDFDFD',
            popupTemplate: function(geography, data) { //this function should just return a string
              return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
            },
            popupOnHover: true, //disable the popup while hovering
            highlightOnHover: true,
            highlightFillColor: '#bada55',
            highlightBorderColor: '#34b233',
            highlightBorderWidth: 1,
            highlightBorderOpacity: 1
        },
        dataType: 'json',
        dataUrl: null, //if not null, datamaps will attempt to fetch this based on dataType ( default: json )
        data: {
            // NGA: {fillKey: 'major' },
            // KEN: {fillKey: 'major' },
            // GHA: {fillKey: 'major' },
            // EGY: {fillKey: 'medium'},
            // ZAF: {fillKey: 'medium' },
            // MDG: {fillKey: 'minor' }       
        },
        setProjection: function (element) {
            var projection = d3.geo.mercator()
                .center([15.7557679, 13.31369]) // E Latitude, N Longitude
                .rotate([20.4, 0])
                .scale(500);
            var path = d3.geo.path().projection(projection);
            return { path: path, projection: projection };
            },
        done: function(datamap) {
            datamap.svg.call(d3.behavior.zoom().on("zoom", redraw));
            function redraw() {
                datamap.svg.selectAll("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }
            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                alert(geography.properties.name);
            });
        }
        })      

        //bubbles, custom popup on hover template
        map.bubbles([
           {name: 'Hot', latitude: 21.32, longitude: 5.32, radius: 10, fillKey: 'major'},
           {name: 'Chilly', latitude: -25.32, longitude: 120.32, radius: 18, fillKey: 'medium'},
           {name: 'Hot again', latitude: 21.32, longitude: -84.32, radius: 8, fillKey: 'minor'},

           ], {
               popupTemplate: function(geo, data) {
                 return "<div class='hoverinfo'>It is " + data.name + "</div>";
             }
         })

        // Alternatively with d3
        d3.select(window).on('resize', function() {
            map.resize();
        });

    </script>
</body>