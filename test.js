const vgn = require('./index');



//getStops('Plärrer', {limit: 1});
//getStopsbygps('49.45015694', '11.083455', {limit: 1, distance: 400, sort: 'Distance'});
getDepartures('704', {Product: "ubahn", TimeSpan: 10, TimeDelay: 45, LimitCount: 10})


function getStops(name, parameter){
   vgn.getStops(name, parameter).then(
      function(message) {
      console.log(message);
      }).catch(error => console.log(error));
}

function getStopsbygps(lat, lon, parameter){
   vgn.getStopsbygps(lat, lon, parameter).then(
      function(message) {
      console.log(message);
      }).catch(error => console.log(error));
}

function getDepartures(ID, parameter){
   vgn.getDepartures(ID, parameter).then(
      function(message) {
      console.log(message);
      }).catch(error => console.log(error));
}