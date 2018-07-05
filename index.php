<!DOCTYPE html>
<head>
<title>VC4A Index (Beta)</title>
<link rel="apple-touch-icon" sizes="57x57" href="img/apple-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="img/apple-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="img/apple-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="img/apple-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="img/apple-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="img/apple-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="img/apple-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="img/apple-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="img/apple-icon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192"  href="img/android-icon-192x192.png">
<link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="img/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="img/favicon-16x16.png">
<link rel="manifest" href="/manifest.json">
<meta name="msapplication-TileColor" content="#ffffff">
<meta name="msapplication-TileImage" content="img/ms-icon-144x144.png">
<meta name="theme-color" content="#ffffff">
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