const vgn = require('./index');



//getStops('Luitpoldhain', {limit: 1});
//getStopsbygps('49.45015694', '11.083455', {limit: 1, distance: 400, sort: 'Distance'});
//getDepartures('704', {Product: "ubahn", TimeSpan: 10, TimeDelay: 45, LimitCount: 10})
//getDeparturesbygps('49.4480881582118', '11.0647882822154', {Product: "ubahn", TimeSpan: 10, TimeDelay: 45, LimitCount: 2, limit: 100, distance: 500, sort: 'Distance'})
getStopsPHP('Weißer Turm', {limit: 1});

function getStops(name, parameter){
   var t0 = new Date().getTime();
   vgn.getStops(name, parameter).then(
      function(message) {
      console.log(message);
      var t1 = new Date().getTime();
      console.log("This took: " + (t1 - t0) + " milliseconds.")
      }).catch(error => console.log(error));
}

function getStopsbygps(lat, lon, parameter){
   var t0 = new Date().getTime();
   vgn.getStopsbygps(lat, lon, parameter).then(
      function(message) {
      console.log(message);
      var t1 = new Date().getTime();
      console.log("This took: " + (t1 - t0) + " milliseconds.")
      }).catch(error => console.log(error));
}

function getDepartures(ID, parameter){
   var t0 = new Date().getTime();
   vgn.getDepartures(ID, parameter).then(
      function(message) {
      console.log(message);
      var t1 = new Date().getTime();
      console.log("This took: " + (t1 - t0) + " milliseconds.")
      }).catch(error => console.log(error));
}

function getDeparturesbygps(lat, lon, parameter){
   var t0 = new Date().getTime();
   vgn.getDeparturesbygps(lat, lon, parameter).then(
      function(message) {
      console.log(message);
      var t1 = new Date().getTime();
      console.log("This took: " + (t1 - t0) + " milliseconds.")
      }).catch(error => console.log(error));
}

function getStopsPHP(name, parameter){
   var t0 = new Date().getTime();
   vgn.getStopsPHP(name, parameter).then(
      function(message) {
      console.log(message);
      var t1 = new Date().getTime();
      console.log("This took: " + (t1 - t0) + " milliseconds.")
      }).catch(error => console.log(error));
}