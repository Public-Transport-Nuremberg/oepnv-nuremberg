# oepnv-nuremberg  
 A wrapper for multiple datapoints from VAG and VGN  
  
## Where is the data comming from?  
 Departures and stops are comming from the official VAG API endpoint  
 URL: https://opendata.vag.de/  
 License: Creative Commons Attribution 4.0 Int.  
  
 Stops based on an adress  comee from an undocumented endpoint of the VGN  
 URL: HPSSuggest.php  
 License: Unknown  
  
 Connections between stops come from a web scraper directly from VGN.de.  
 URL: https://www.vgn.de/verbindungen/  
 License: Unknown  

## Functions and todo list

- [ ] Departures based on Ids (Not supported by API, will use Cache)
- [X] Departures based on names
- [ ] Departures based on GPS
- [X] Stops based on names
- [X] Stops based on GPS
- [ ] Cacheing of Stops
- [ ] Stops based on IDs (Not supported by API, will use Cache)
- [ ] Turn adress into GPS
- [ ] Turn adress into list of near stops
- [ ] Get routes from and to stops
- [ ] Get routes to anything. IDs, Stopnames, Adresses, GPS
  
## Usage
 > A working example is [Test.js](https://github.com/BolverBlitz/oepnv-nuremberg/blob/main/test.js)

 Usage:
 ```js
 const vgn = require('oepnv-nuremberg');

 var Name = 'Opern';
 vgn.getstops(Name).then(
   function(message) {
     console.log(message);
 }).catch(error => console.log(error));
 ```

## Methods

### getstops
limit: Limit the listed stops to this amount  
 ```js
getstops('Plärrer', {limit: 1});
 ```

### getstopsbygps
limit: Limit the listed stops to this amount  
distance: Limit to stops in a radius in meters arround your GPS position (default: 500m)  
sort: Sort your stops by distance or alphabetically (default: 'distance')  
 ```js
getstopsbygps('49.45015694', '11.083455', {limit: 3, distance: 200, sort: 'distance'});
 ```

### getDepartures
Product: Bus/Ubahn or Tram
TImeSpan: In minutes
TimeDelay: Look for departures later in Minutes
LimitCount: Limit the listed departures to this amount 
```js
getDepartures('704', {Product: "ubahn", TimeSpan: 10, TimeDelay: 445, LimitCount: 10})
```