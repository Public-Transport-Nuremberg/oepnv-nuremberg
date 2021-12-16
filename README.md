# oepnv-nuremberg  
 A wrapper for multiple datapoints from VAG and VGN  
 
## Functions and todo list

- [X] Departures based on Ids 
- [ ] Departures based on names (Not supported by API, will use Cache)
- [X] Departures based on GPS
- [ ] Stops based on IDs (Not supported by API, will use Cache)
- [X] Stops based on names
- [X] Stops based on GPS
- [ ] Cacheing of Stops
- [ ] Turn (part of)adress into list of near stops
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

### getStops
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| limit | Max amount of stops returned  | - | Number |
 ```js
getStops('Plärrer', {limit: 1});
 ```

### getStopsbygps
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| limit | Max amount of stops returned  | - | Number |
| distance | Max distance to given GPS Position  | 500 m | Number |
| sort | Sort your stops by distance or alphabetically | distance | distance/alphabetically |
 ```js
getStopsbygps('49.45015694', '11.083455', {limit: 3, distance: 200, sort: 'distance'});
 ```

### getDepartures
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| Product | Only return departures of one or multiple products  | - | Bus, Tram, UBahn |
| TimeSpan | Return departures until that time  | - | Number |
| TimeDelay | Look for now + x in minutes | - | Number |
| LimitCount | Max amount of departures returned | - | Number |
```js
getDepartures('704', {Product: "ubahn", TimeSpan: 10, TimeDelay: 445, LimitCount: 10})
```

### getDeparturesbygps
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| limit | Max amount of stops returned  | - | Number |
| distance | Max distance to given GPS Position  | 500 m | Number |
| sort | Sort your stops by distance or alphabetically | distance | distance/alphabetically |
| Product | Only return departures of one or multiple products  | - | Bus, Tram, UBahn |
| TimeSpan | Return departures until that time  | - | Number |
| TimeDelay | Look for now + x in minutes | - | Number |
| LimitCount | Max amount of departures returned | - | Number |
```js
getDeparturesbygps('49.4480881582118', '11.0647882822154', {Product: "ubahn", TimeSpan: 10, TimeDelay: 45, LimitCount: 2, limit: 5, distance: 200, sort: 'Distance'})
```

## Where is the data comming from?  
 Departures and stops are comming from the official VAG API endpoint  
 URL: https://opendata.vag.de/  
 License: Creative Commons Attribution 4.0 Int. 