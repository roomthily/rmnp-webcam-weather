// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  console.log('hello world :o');
  
  var tests = [
    {
      name: 'Alpine Visitors Center',
      webcam: 'alpine'
    },
    {
      name: 'Longs Peak',
      webcam: 'longspeak'
    },
    {
      name: 'Continental Divide from Glacier Basin',
      webcam: 'divide'
    }
  ]

  // run each test for eyeballing things
  var $div = $('div.palette');
  
  tests.forEach(function(cam) {
    
    $.get({url: '/weather', data:{webcam: cam.webcam}, success: function(data) {
      // templatize
      data.name = cam.name;
      
      // if not sending a url, the image is returned as a tmp url

      console.log(data);
      var output = tmpl(data);
      $div.append(output);
    }});

  });
  
  const tmpl = Handlebars.compile('<div class="image"><h1 class="weather-{{weather}}">{{name}}</h1>{{#if url}}<img src="{{url}}"/>{{else}}<img src="{{dataUri}}" />{{/if}}<dl class="colors"><dt>{{dominant}}* ({{percent}}%)</dt><dd style="background-color: {{dominant}};"></dd>{{#each palette}}<dt>{{.}}</dt><dd style="background-color: {{.}};"></dd>{{/each}}</dl></div>');

});
