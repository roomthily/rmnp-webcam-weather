// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var suncalc = require('suncalc');
var moment = require('moment');

// webcams: https://www.nps.gov/romo/learn/photosmultimedia/webcams.htm

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/weather", function (request, response) {
  var webcam = request.query.webcam || "divide";
  
  console.log(_goldenhour(webcam));
  
  response.send('');
});

const webcam_coords = {
  "alpine": [40.441070, -105.753852],
  "longspeak": [40.282477, -105.542896], // a guess based on the desc.
  "divide": [40.328202, -105.595765]
};

function _goldenhour(webcam) {
  // so check the webcam from the start of golden hour
  // to dusk for mountain time
  var d = Date.parse(new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
  
  var calc = suncalc.getTimes(d, webcam_coords[webcam][0], webcam_coords[webcam][1]);
  
  console.log(calc);
  
  // these are the timestamps
  var dusk = Date.parse(calc.dusk.toLocaleString("en-US", {timeZone: "America/Denver"}));
  var goldenhour = Date.parse(calc.goldenHour.toLocaleString("en-US", {timeZone: "America/Denver"}));
  
  // our time bin
  return [goldenhour, dusk];
}


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

//                                                   ?yyyyMddHHmmss
// https://www.nps.gov/webcams-romo/glacier_basin.jpg?2017529132118
// but! it might be possible without the timestamp qs


// glacier basin snaps:
//   https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Fglacier_basin_overcast.jpg?1498765829796
