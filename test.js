const util = require('util')
const vgn_wrapper = require('./index');
const geolib = require("geolib");

const api_url = "https://start.vag.de/dm/api";
const vag_url= "https://efa-gateway.vag.de";

const vgn = new vgn_wrapper.openvgn(api_url, vag_url);

/*
Plärrer: 704
Hardhöhe: 2390

Fahrzeugnummer Ubahn
3: Langzug
1: Kurzzug

Fahrzeugnummer Bus
3 Stellig: VAG
4 Stellig: Extern (Now supported by PVU List)

GTV6: 1200er
GT8N: 1100er
GT6N: 1000er

*/

(async function (){
    try {
        //const Output = await vgn.getStops("Jakobinen", {limit: 10});
        //const Output = await vgn.getStopsbygps('49.45015694', '11.083455', {limit: 2, distance: 400, sort: 'Distance'});
        //const Output = await vgn.getDepartures(704, {product: "bus", timespan: 60, timedelay: 0, limitcount: 5})
        //const Output = await vgn.getDepartures("PL", { Product: "Bus", TimeSpan: 60, TimeDelay: 0, LimitCount: 3 })
        //const OutputCompare = await askURL(`https://start.vag.de/dm/api/abfahrten.json/VAG/PLAE/4?Product=Tram&TimeSpan=60&TimeDelay=0&LimitCount=5`)
        const Output = await vgn.getVagWebpageDisturbances()
        //const Output = await vgn.getVehicleDataById(101)
        //const Output = await vgn.getDeparturesbygps('49.4480881582118', '11.0647882822154', {Product: "Bus,Tram", TimeSpan: 20, TimeDelay: 0, LimitCount: 5, limit: 100, distance: 500, sort: 'Distance'})
        //console.log("Should only contain departures from line 4")
        //console.log(OutputCompare.Abfahrten)
        //console.log("Should only contain departures from line 4 but using normal Departures and filters output")
        //console.log(Output.Departures.filter(entry => entry.Linienname == "4"))
        //const Output = await vgn.getTrip(1000560, {product: "ubahn"})
        //const Output = await vgn.reverseGeocode('49.4480881582118', '11.0647882822154')
        //const Output = await vgn.geoLines("8")
        //const Output = await vgn.getTrips("Ubahn", {timespan: 10})
        //const Output = await vgn.getLocations("Plärrer")
        console.log(util.inspect(Output, false, null, true /* enable colors */))
    } catch (e) {
        console.log(e)
    }
})();