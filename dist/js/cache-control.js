/**
  * Nodejs cache controller.
  * Updates the data cache by asynchronously querying the VC4A API.
  * Results are stored in tab-delimited file.
  * Requires node-rate-limiter.
*/

updateCache();

// Updates cached financial data for overview map
function updateCache() {

    const https = require("https");
    const fs = require('fs');
    const RateLimiter = require('limiter').RateLimiter;
    const dataPath = '../../data/vc4a-cache.tsv';

    // Define VC4A focus countries 
    var vc4aCountries = {
        "108": "Burundi",
        "120": "Cameroon",
        "140": "Central African Rep",
        "148": "Chad",
        "178": "Congo",
        "180": "Dem. Rep. Congo",
        "204": "Benin",
        "226": "Equatorial Guinea",
        "231": "Ethiopia",
        "232": "Eritrea",
        "262": "Djibouti",
        "266": "Gabon",
        "270": "Gambia",
        "288": "Ghana",
        "324": "Guinea",
        "384": "Ivory Coast",
        "404": "Kenya",
        "426": "Lesotho",
        "430": "Liberia",
        "434": "Libya",
        "450": "Madagascar",
        "454": "Malawi",
        "466": "Mali",
        "478": "Mauritania",
        "504": "Morocco",
        "508": "Mozambique",
        "516": "Namibia",
        "562": "Niger",
        "566": "Nigeria",
        "624": "Guinea Bissau",
        "646": "Rwanda",
        "686": "Senegal",
        "694": "Sierra Leone",
        "706": "Somalia",
        "710": "South Africa",
        "716": "Zimbabwe",
        "728": "South Sudan",
        "729": "Sudan",
        "732": "Western Sahara",
        "748": "Swaziland",
        "768": "Togo",
        "788": "Tunisia",
        "800": "Uganda",
        "818": "Egypt",
        "834": "Tanzania",
        "854": "Burkina Faso",
        "894": "Zambia",
        "-99": "Somaliland",
        "024": "Angola",
        "072": "Botswana",
        "012": "Algeria"
    };

    // Truncate cache file
    fs.truncate( dataPath, 0, function(){ console.log('Cache truncated') } );

    // Append header
    fs.appendFile( dataPath, "id\tcountry\ttotalCap\n", 'utf8', function(err) {
        if (err) console.log(err);
    });

    // Limit requesets to max 5 per second
    var limiter = new RateLimiter( 5, 'second' );

    // Iterate countries, querying API asyncronously 
    for (var id in vc4aCountries) {
        if ( vc4aCountries.hasOwnProperty(id) ) {
            ( function( country, id ) {

                // Set defaults 
                var limit = 5000,
                    status = 'r_completed';

                const options = {
                    method: "GET",
                    hostname: "api.vc4a.com",
                    port: 443,
                    encoding: null,
                    headers: { 'User-Agent': 'VC4A Cache-control/1.0' },
                    path: "/v1/fundraising/trends.json?status=" + status + "&country=" + encodeURI(country) + "&limit=" + limit
                };

                limiter.removeTokens( 1, function() {  // Use limiter to wrap request function
                    var request = https.request( options, function (res) {
                        var chunks = [];
                       
                        res.on("data", function (chunk) {
                            chunks.push(chunk);
                        });
                        res.on("end", function () {
                            // Check HTTP response status code 
                            if ( ('' + res.statusCode).match(/^2\d\d$/) ) {  // 200, request OK 
                                var json = JSON.parse( Buffer.concat(chunks).toString() );
                                var total = 0;
                                var venturesCount = 0;

                                // Parse capital from json object
                                for ( ventures in json ) {
                                    for ( item in json[ventures] ) {
                                        var capital = json[ventures][item].capital;
                                        for ( round in capital ) {
                                            var amount = capital[round]['amount'];
                                            total += Number( amount );
                                        }
                                    }
                                }
                                //var totalCap = total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                                var dataRow = id + '\t' + country + '\t' + total + '\n';

                                // Append result to cache
                                fs.appendFile(dataPath, dataRow, 'utf8', function(err) {
                                    if (err) console.log(err);   
                                });
                            } else {  // Request not handled 
                                console.log(res.statusCode);
                            }
                        });
                        res.on("error", function (err) {
                            console.log(err);
                        });
                    });
                    request.setTimeout( 5000, function() {
                        request.abort();
                        console.log('Connection timed out');
                        self.emit('pass',message);
                    });
                    request.end();
                }); 
            })( vc4aCountries[id], id );
        }
    }
}
