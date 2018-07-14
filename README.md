![VC4A Index with D3](https://i.imgur.com/vpcoxtB.gif)

# `vc4a-index` [![Release 0.9](https://img.shields.io/badge/Release-0.9-green.svg)](https://github.com/billz/vc4a-index/releases)
The VC4A Index is a lightweight API client that makes use of [D3.js](https://d3js.org/), a JavaScript library for producing interactive data visualizations, and the [VC4A API](https://developers.vc4a.com/).

Specifically, the client makes use of the `/v1/fundraising/trends` public [API endpoint](https://developers.vc4a.com/fundraising.php#v1_fundraising_trends), which permits detailed explorations of fundraising trends by country, financing stage and sector. This client demonstrates how to render a D3 orthographic map, queue external data such as country features, and respond to events that query the VC4A API. 

The implementation is serverless, so it can be executed by downloading the package and running it locally, if you like. A demonstration with the latest updates is hosted at [http://index.vc4afri.ca/](http://index.vc4afri.ca/).
