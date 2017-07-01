// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  console.log('hello world :o');
  
  var tests = [
    {
      name: 'Alpine Visitors Center',
      webcam: 'alpine',
      urls: [
        "https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Falpine_visitor_center-patchy.jpg?1498853999952",
        "https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Falpine_visitor_center%20(1).jpg?1498854161357"
      ]
    },
    {
      name: 'Longs Peak',
      webcam: 'longspeak',
      urls: [
        "https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Flongs_peak.jpg?1498854030737",
        "https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Flongs_peak_partial.jpg?1498855939130"
      ]
    },
    {
      name: 'Continental Divide from Glacier Basin',
      webcam: 'divide',
      urls: [
        'https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Fglacier_basin_overcast.jpg?1498765829796',
        "https://cdn.glitch.com/a2065909-acd9-44c7-8be4-b37d17dee6ef%2Fglacier_basin_overcast_with_gap.jpg?1498854054812"
      ]
    }
  ]

  // run each test for eyeballing things
  var $div = $('div.palette');
  
  tests.forEach(function(cam) {
    
    
    cam.urls.forEach(function (url) {
      console.log(cam.webcam, ' -> ', url);
      $.get({url: '/weather', data:{webcam: cam.webcam, url: url}, success: function(data) {
        // templatize
        data.url = url;
        data.name = cam.name;
        
        console.log(data);
        var output = tmpl(data);
        $div.append(output);
      }});
    });
  });

  
  const tmpl = Handlebars.compile('<div class="image"><h1 class="weather-{{weather}}">{{name}}</h1><img src="{{url}}"/><dl class="colors"><dt>{{dominant}}*</dt><dd style="background-color: {{dominant}};"></dd>{{#each palette}}<dt>{{.}}</dt><dd style="background-color: {{.}};"></dd>{{/each}}</dl></div>');

});
