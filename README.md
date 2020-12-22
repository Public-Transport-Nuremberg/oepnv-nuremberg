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

### Functions and todo list

- [ ] Departures
- [ ] Stops based on names
- [ ] Stops based on GPS
- [ ] Cacheing of Stops
- [ ] Stops based on IDs (Not supported by API, will use Cache)
- [ ] Turn adress into GPS
- [ ] Turn adress into list of near stops
- [ ] Get routes from and to stops
- [ ] Get routes to anything. IDs, Stopnames, Adresses, GPS
  
### Usage
 > A working example is [Test.js](URL)

 Usage:
 ```js
 const vgn = require('oepnv-nuremberg');

 var Name = 'Opern';
 vgn.Haltestellen(Name).then(
    function(message) {
     console.log(message);
    });
 ```