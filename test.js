const vgn = require('./index');

var Data = {
   lat: '49.45015694',
   lon: '11.083455',
   limit: 3,
   };



getstops("Plärrer");
getstopsbygps(Data);


function getstops(Name){
   vgn.getstops(Name).then(
      function(message) {
      console.log(message);
      }).catch(error => console.log(error));
}

function getstopsbygps(Data){
   vgn.getstopsbygps(Data).then(
      function(message) {
      console.log(message);
      }).catch(error => console.log(error));
}