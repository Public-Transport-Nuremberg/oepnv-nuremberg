# oepnv-nuremberg  
 A wrapper for multiple datapoints from VAG and VGN  
 
## Functions and todo list

- [X] Departures based on Ids (Also VAG StopIDs, like "PL" for ID 704)
- [X] Departures based on GPS
- [X] Stops based on names
- [X] Stops based on GPS
- [X] Get Trips
- [X] Get Trip
- [ ] Turn (part of)adress into list of near stops
- [ ] Get routes from and to stops
- [ ] Get routes to anything. IDs, Stopnames, Adresses, GPS
  
## Usage
 > A working example is [Test.js](https://github.com/BolverBlitz/oepnv-nuremberg/blob/main/test.js)

 Usage:
 ```js
const vgn_wrapper = require('./index');

const vgn = new vgn_wrapper.openvgn();

async function main(){
    const Output = await vgn.getStops('Luitpoldhain', {limit: 1});
    console.log(Output);
}

main();
 ```

## Methods

### getStops
This will get you all known data about a stop.  
  
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| limit | Max amount of stops returned  | - | Number |
 ```js
getStops('Plärrer', {limit: 1});
 ```

### getStopsbygps
This will list all stops in a given radius.  
   
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| limit | Max amount of stops returned  | - | Number |
| distance | Max distance to given GPS Position  | 500 m | Number |
| sort | Sort your stops by distance or alphabetically | distance | distance/alphabetically |
 ```js
getStopsbygps('49.45015694', '11.083455', {limit: 3, distance: 200, sort: 'distance'});
 ```

### getDepartures
This will list all departures from a given stop.  
  
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| Product | Only return departures of one or multiple products  | - | Ubahn,Bus,Tram,Sbahn |
| TimeSpan | Return departures until that time  | - | Number |
| TimeDelay | Look for now + x in minutes | - | Number |
| LimitCount | Max amount of departures returned | - | Number |
```js
getDepartures('704', {Product: "ubahn", TimeSpan: 10, TimeDelay: 445, LimitCount: 10})
//Or
getDepartures('PL', {Product: "ubahn", TimeSpan: 10, TimeDelay: 445, LimitCount: 10})
```

### getDeparturesbygps
This will list all stops with departure data in a given radius.  
  
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| limit | Max amount of stops returned  | - | Number |
| distance | Max distance to given GPS Position  | 500 m | Number |
| sort | Sort your stops by distance or alphabetically | distance | distance/alphabetically |
| Product | Only return departures of one or multiple products  | - | Ubahn,Bus,Tram,Sbahn |
| TimeSpan | Return departures until that time  | - | Number |
| TimeDelay | Look for now + x in minutes | - | Number |
| LimitCount | Max amount of departures returned | - | Number |
```js
getDeparturesbygps('49.4480881582118', '11.0647882822154', {Product: "ubahn", TimeSpan: 10, TimeDelay: 45, LimitCount: 2, limit: 5, distance: 200, sort: 'Distance'})
```

### getTrip
This will display all stations that the product has and will pass from start to finish.  
You can get the number (Fahrtnummer) from a getDepartures call.  
  
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| Product | Only return departures of one or multiple products  | - | Ubahn,Bus,Tram |
```js
getTrip(1000917, {Product: "ubahn"})
```

### getTrips
This will list all trips of the given product (Ubahn, Tram, Bus) in a given timespan.
  
| Parameters | Definition  | Default Value | Possible Value |
| ------------- | ------------- | ------------- | ------------- |
| TimeSpan | Return departures until that time  | - | Number |
```js
vgn.getTrips("Ubahn", {timespan: 10})
```

## Where is the data comming from?  
 Departures and stops are comming from the official VAG API endpoint  
 URL: https://opendata.vag.de/  
 License: Creative Commons Attribution 4.0 Int. 