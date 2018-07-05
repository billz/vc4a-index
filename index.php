<!DOCTYPE html>
<head>
<title>VC4A Index (Beta)</title>

<link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="img/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="img/favicon-16x16.png">
<link rel="manifest" href="/manifest.json">
<link rel='stylesheet' id='vc4a-index-css'  href='dist/css/style.css' type='text/css' media='all' />
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
            geographyConfig: {            
                borderWidth: 2,
                borderOpacity: 1,
                borderColor: '#fdfdfd',
                popupTemplate: function(geography, data) { //this function should just return a string
                  return '<div class="hoverinfo"><strong>' + data.info + '</strong></div>';
                },
                popupOnHover: true, //disable the popup while hovering
                highlightOnHover: true,
                highlightFillColor: '#40aa34',
                highlightBorderColor: '#fdfdfd',
                highlightBorderWidth: 2,
                highlightBorderOpacity: 1
            },
            dataType: 'json',
            dataUrl: 'data/vc4a.json', //if not null, datamaps will attempt to fetch this based on dataType ( default: json )
            data: {},
            fills: {
                defaultFill: '#cbcbcb',
                vc4a_red: '#df0921',
                vc4a_grn: '#40aa34',
                vc4a_yel: '#ffe504',
                vc4a_brd: '#2e9e2d',
                vc4a_blu: '#1b98d5',
                vc4a_blk: '#000000'
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
                    console.log(geography.properties.name);

                    dataUrl: 'https://api.vc4a.com/v1/fundraising/stages.json';
                    dataType: 'json';
                
                    
                });
            }
        })      

        //bubbles, custom popup on hover template
        // map.bubbles([
        //    {name: 'Hot', latitude: 21.32, longitude: 5.32, radius: 10, fillKey: 'major'},
        //    {name: 'Chilly', latitude: -25.32, longitude: 120.32, radius: 18, fillKey: 'medium'},
        //    {name: 'Hot again', latitude: 21.32, longitude: -84.32, radius: 8, fillKey: 'minor'},

        //    ], {
        //        popupTemplate: function(geo, data) {
        //          return "<div class='hoverinfo'>It is " + data.name + "</div>";
        //      }
        //  })

        // Resize responsive window with d3
        d3.select(window).on('resize', function() {
            map.resize();
        });



    </script>
</body>