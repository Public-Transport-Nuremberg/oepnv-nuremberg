const vgn = require('./index');



getstops('Plärrer', {limit: 1});
getstopsbygps('49.45015694', '11.083455', {limit: 1, distance: 400, sort: 'Distance'});


function getstops(name, parameter){
   vgn.getstops(name, parameter).then(
      function(message) {
      console.log(message);
      }).catch(error => console.log(error));
}

function getstopsbygps(lat, lon, parameter){
   vgn.getstopsbygps(lat, lon, parameter).then(
      function(message) {
      console.log(message);
      }).catch(error => console.log(error));
}