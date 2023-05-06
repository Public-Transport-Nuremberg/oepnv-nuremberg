# oepnv-nuremberg  
 A wrapper for multiple datapoints from VAG and VGN.  
 Serves stations and depatures with extra information, so you not only know when your next bus is comming but also if it has air conditioning.  
 Stations also include if they are barrier-free, this if important for disabled people.  
 It can scrape VAG webpage to get current events, like a elevator malfunction in realtime.

# Updating
Version: 0.0.1 to 0.0.5 Compatible  
Version: 0.0.5 to 0.1.0 Not compatible, a lot was rewritten  
Version: 0.1.2 to 0.2.0 Not compatible, abfahrten output now contains more info  
 
## Functions and todo list

- [X] Departures based on Ids (Also VAG StopIDs, like "PL" for ID 704)
- [X] Departures based on GPS
- [X] Stops based on names
- [X] Stops based on GPS
- [X] Get Trips
- [X] Get Trip
- [?] Get elevator malfunctions
- [?] Get current timetable changes
- [X] Turn (part of) adress into list of near stops
- [X] Turn GPS into Adress
- [ ] Get routes from stop to stop
- [ ] Get routes to anything. IDs, Stopnames, Adresses, GPS
- [ ] Misc functions
  - [X] Calculate travle time between 2 stops from a Trip Object
  
## Usage
 NodeJS 16.0 or higher  
 > A working example is [Test.js](https://github.com/BolverBlitz/oepnv-nuremberg/blob/main/test.js)

 Usage:
 ```js
const vgn_wrapper = require('./index');

const vgn = new vgn_wrapper.openvgn();

(async function (){
  try {
    const Output = await vgn.getStops('Luitpoldhain', {limit: 1});
    console.log(Output);
  } catch (e) {
    console.log(e)
  }
})();
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
getTrips("Ubahn", {timespan: 10})
```

### calculateTripTime and calculateActualTripTime
This will calculate the time it takes to travel from one stop to another.  

```js
calculateTripTime(getTripResponse, "LS", "704") // Returns difference in seconds acourting to the timetable
calculateActualTripTime(getTripResponse, "LS", "704") // Returns difference in seconds acourting to the actual time
```

### getVagWebpageDisturbances (BETA)
This method is very unstable because the webpage is very complicated.  
This will return a object based on the current webpage.  
The object might not have all the keys, its generated only by the current content!  
  
```js
{
  "schedule_changes": {
    "U-Bahn": [{...},{...}],
    "Bus": [{...},{...}],
    "Tram": [{...},{...}]
  },
  "disturbances": {
    "Aufzugsstörungen": [{...},{...}],
    "U-Bahn": [{...},{...}],
    "Bus": [{...},{...}],
    "Tram": [{...},{...}]
  },
  "Meta": {
    "Timestamp": Timestamp,
    "RequestTime": Number,
    "ParseTime": Number,
    "URL": 'https://www.vag.de/fahrplan/fahrplanaenderungen-stoerungen'
  }
}
```

```js
getVagWebpageDisturbances()
```

### reverseGeocode
This method will return the closest adress to the given GPS Position.
```js
reverseGeocode('49.4480881582118', '11.0647882822154')
```

## More info
### "Tram Steighöhen" | Tram platform heights
| platform heights | Number in data  | Explanation |
| ------------- | ------------- | ------------- |
| 15 cm bis 25 cm rise | 1 | barrier-free |
| 15 cm bis 25 cm rise | 2 | not barrier-free |
| 15 cm bis 25 cm rise | 3 | not barrier-free |
| Tilt change platform | 4 | not barrier-free |
| Crossing up to 3cm high | 5 | not barrier-free |
| No Platrom at all | 6 | not barrier-free |



## Where is the data comming from?  
 Departures and stops are comming from the official VAG API endpoint  
 URL: https://opendata.vag.de/  
 License: Creative Commons Attribution 4.0 Int. 

 Elevator disruptions and timetable deviations are comming from here  
 URL: https://www.vag.de/fahrplan/fahrplanaenderungen-stoerungen  
 License: Unknown   

 Bus numbers from external companys are from nahverkehr-franken.de  
 URL: https://www.nahverkehr-franken.de  
 License: Unknown
