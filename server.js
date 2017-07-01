// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var suncalc = require('suncalc'),
    client = require('node-rest-client').Client, 
    jimp = require('jimp'),
    thief = require('color-thief-jimp'),
    chroma = require('chroma-js');

// webcams: https://www.nps.gov/romo/learn/photosmultimedia/webcams.htm

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// the webcam info
//   url: base url to the image, ignoring the timestamp (seconds is problematic)
//   coords: rough guess as to the location of the webcam
//   crop: (min-x, min-y, max-x, max-y) to serve as a very basic map 
//         to determine sky color
// image dims: 1024 × 768
// also try to clip out the camera header/watermark (it is blue
//   maybe affects the palette at least)
const webcams = {
  "alpine": {
    url: "https://www.nps.gov/webcams-romo/alpine_visitor_center.jpg",
    coords: [40.441070, -105.753852],
    crop: [0, 12, 1024, 180]
  },
  "longspeak": {
    url: "https://www.nps.gov/webcams-romo/longs_peak.jpg",
    coords: [40.282477, -105.542896], // a guess based on the desc.
    crop: [0, 12, 1024, 190]
  },
  "divide": {
    url: "https://www.nps.gov/webcams-romo/glacier_basin.jpg",
    coords: [40.328202, -105.595765],
    crop: [0, 12, 830, 290]
  }
}

app.get("/weather", function (request, response) {
  // query params:
  //  webcam: longspeak || alpine || divide
  //  url: a url to override the live webcam (for testing)
  //
  // the webcams update every ten minutes, at 1 past(?)
  //
  // return the dominant color, color palette, and 
  //   whether the dominant color is likely to be weather-related
  //   ie, not blue skies
  
  var webcam = request.query.webcam || "divide";
  var url = request.query.url || webcams[webcam].url;
 
  var Client = new client();
  var req = Client.get(url,
    undefined,
    function(data, res) {
      // get the jpg image
      // load to jimp
      // deal with the mask problem
      
      // for the sky pixels
      //  a: get avg color || dominant colors
      //  b: if BLUE, no weather else grey/white/other (scary): weather
      
      jimp.read(data)
      .then(function(snap) {
        // let's see if that even worked
        console.log(snap != undefined, snap.bitmap.width, snap.bitmap.height);
        
        // for the divide view, it's like a box in the upper left
        // so let's fake the mask part and deal with the color
        var cropped = snap.crop(0, 0, Math.floor(snap.bitmap.width/5), Math.floor(snap.bitmap.height/5));
        
        var dom = thief.getColor(cropped);
        var palette = thief.getPalette(cropped);
        
        console.log(chroma(dom).hex());
        console.log(palette);
        
        var am_i_blue = _close_to_blue(dom);
        console.log('am i weather? ', am_i_blue);
        
        response.json({
          "dominant": chroma(dom).hex(), 
          "palette": palette.map(p => chroma(p).hex()),
          "weather": am_i_blue !== true
        });
        
      }).catch(function(err) {
        console.log('jimp error: ', err);
      }); 
    }
  ).on('error', function(error) {
    response.json({'error': error});
  });
});

function _close_to_blue(color) {
  var hsl = chroma(color).hsl();
  // is the hue within the blue range?
  // is it too light or too dark?
  // is it approaching unsaturated?
  if ((hsl[0] > 180 && hsl[0] < 260) &&
       (hsl[1] > 0.3) && (hsl[2] > 0.2 && hsl[2] < 0.9)
     ) {
      return true;
  }
  
  return false;
}

function _goldenhour(webcam) {
  // so check the webcam from the start of golden hour
  // to dusk for mountain time
  var d = Date.parse(new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
  
  var calc = suncalc.getTimes(d, webcams[webcam].coords[0], webcams[webcam].coords[1]);
  
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

