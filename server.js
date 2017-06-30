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

app.get("/weather", function (request, response) {
  var webcam = request.query.webcam || "divide";
  
  // at some point, want to timebox the request
  // console.log(_goldenhour(webcam));
  
  // a test imge
  var url = 'https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Fglacier_basin_overcast.jpg?1498765829796';
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
        
        _close_to_blue(dom);
        
        response.json({"dominant": chroma(dom).hex(), "palette": palette.map(p => chroma(p).hex())});
        
      }).catch(function(err) {
        console.log('jimp error: ', err);
      }); 
    }
  ).on('error', function(error) {
    response.json({'error': error});
  });
});

function _close_to_blue(color) {
  // something to test with since it is cloudy
  // #7CB3EC lighter rgb(124, 179, 236)
  // #567DC2 darker rgb(86, 125, 194)
  
  // red rgb(230, 24, 24)
  // yellow rgb(230, 186, 24)
  // a green rgb(24, 230, 141)
  // mmore turquoise rgb(8, 246, 226)
  
  // everything to lab colors
  // as {L: , A: , B: }
  var src_lab = chroma(color).lab();
  var src = {L: src_lab[0], A: src_lab[1], B: src_lab[2]};
  
  // tmp sorrows
  var blues = [[124, 179, 236], [86, 125, 194], [230, 24, 24], [230, 186, 24], [24, 230, 141], [8, 246, 226]].map(c => { var lab = chroma(c).lab(); return {L: lab[0], A: lab[1], B: lab[2]}});
  
  for (var b in blues) {
    console.log(b, delta.getDeltaE00(src, blues[b]));
  }
  
  return false;
}

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
