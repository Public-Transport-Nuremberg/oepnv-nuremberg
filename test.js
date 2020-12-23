const vgn = require('./index');

var Name = 'Plärrer';
vgn.getstops(Name).then(
   function(message) {
    console.log(message);
   }).catch(error => console.log('inlineQuery Error:', error));