// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var suncalc = require('suncalc'),
    client = require('node-rest-client').Client, 
    jimp = require('jimp'),
    thief = require('color-thief-jimp'),
    chroma = require('chroma-js'),
    delta = require('delta-e');

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

// NOTE: this is probably not a good enough Is it blue? solution
// too many false positives due to lightness/saturation similarities
// (i think. did  not poke around too too much).
function _close_to_blueX(color) {
  // something to test with since it is cloudy
  // #7CB3EC lighter rgb(124, 179, 236)
  // #567DC2 darker rgb(86, 125, 194)
  // co valley: #466FAF, #3E6699, #3F6DAB, #5F87C4
  
  // for testing the diff calcs
  // red rgb(230, 24, 24)
  // yellow rgb(230, 186,n 24)
  // a green rgb(24, 230, 141)
  // more turquoise rgb(8, 246, 226)
  
  // everything to lab colors
  // as {L: , A: , B: }
  var src_lab = chroma(color).lab();
  var src = {L: src_lab[0], A: src_lab[1], B: src_lab[2]};
  
  // tmp sorrows (this includes a red, yellow, and greens)
  // var blues = [[124, 179, 236], [86, 125, 194], [230, 24, 24], [230, 186, 24], [24, 230, 141], [8, 246, 226]].map(c => { var lab = chroma(c).lab(); return {L: lab[0], A: lab[1], B: lab[2]}});
  
  var blues = [
    [124, 179, 236], 
    [86, 125, 194],
    [70, 111, 175],
    [62, 102, 153],
    [95, 135, 196],
    [87, 93, 126]
  ].map(
    c => { var lab = chroma(c).lab(); return {L: lab[0], A: lab[1], B: lab[2]}}
  );
  
  // if any is similar to the dominant color,
  // it's not weather
  // where similar = delta-e < 5?
  // (5 is not high enough)
  return blues.some(b => {
    return delta.getDeltaE00(src, b) > 10.;
  });
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


// glacier basin snaps:
//   https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Fglacier_basin_overcast.jpg?1498765829796
