// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  console.log('hello world :o');
  
  $.get({url: '/weather', success: function(data) {
    // templatize
    var output = tmpl(data);
    $('div.palette').html(output);
  }});
  
  const tmpl = Handlebars.compile('<p style="background-color:{{dominant}}">Dominant Color</p><div class="others">{{#each palette}}<div style="background-color:{{.}}">{{.}}</div>{{/each}}');});


/*

{
  dominant: "#9fa9b0",
  palette: ["#acb3b7","#445373","#e9ebea","#677a8f","#d1ddda","#b4bedf","#60647c","#7c818d","#646c74"]
}

*/