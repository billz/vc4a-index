
updateCache();

// Updates cached financial data for overview map
function updateCache() {

    const https = require("https");
    const fs = require('fs');

    // Define VC4A focus countries 
    var vc4aCountries = {
        "120": "Cameroon",
        // "288": "Ghana",
        // "646": "Rwanda",
        // "686": "Senegal",
        "800": "Uganda"
    };

    for (var key in vc4aCountries) {
        if ( vc4aCountries.hasOwnProperty(key) ) {
            country = vc4aCountries[key];

            // Set defaults 
            var limit = 5000;

            var options = {
                method: "GET",
                hostname: "api.vc4a.com",
                port: 443,
                encoding: null,
                path: "/v1/fundraising/trends.json?status=r_completed&country=" + country + "&limit=" + limit
            };

            var request = https.request(options, function (res) {
                var chunks = [];

                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });

                res.on("end", function () {
                    var json = JSON.parse(Buffer.concat(chunks).toString());
                    var total = 0;
                    var venturesCount = 0;

                    for ( ventures in json ) {
                        for ( item in json[ventures] ) {
                            var capital = json[ventures][item].capital;
                            for ( round in capital ) {
                                var amount = capital[round]['amount'];
                                total += Number( amount );
                            }
                        }
                    }
                    var totalCap = total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                    var dataRow = country + '\t' + totalCap;
                    console.log(dataRow);

                    //console.log(json);

                    //fs.writeFile('../../data/vc4a-cache.json', JSON.stringify(json), 'utf8', function(err) {
                        //if (err) throw err;    
                    //});

                });
            });
            request.end();
        }
    }

}