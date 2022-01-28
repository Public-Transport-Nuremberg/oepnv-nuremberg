const util = require('util')
const vgn_wrapper = require('./index');

const api_url = "https://start.vag.de/dm/api";
const vag_url= "https://apigateway.vag.de/efa/";

const vgn = new vgn_wrapper.openvgn(api_url, vag_url);



async function main(){
    try {
        //const Output = await vgn.getStops('Hardhöhe', {limit: 10});
        //const Output = await vgn.getStopsbygps('49.45015694', '11.083455', {limit: 2, distance: 400, sort: 'Distance'});
        //const Output = await vgn.getDepartures('704', {Product: "Ubahn,Bus,Tram", TimeSpan: 60, TimeDelay: 0, LimitCount: 5, Line: "4"})
        const Output = await vgn.getDepartures('HF', {Product: "Ubahn", TimeSpan: 60, TimeDelay: 0, LimitCount: 5})
        //const Output = await vgn.getDeparturesbygps('49.4480881582118', '11.0647882822154', {Product: "ubahn", TimeSpan: 20, TimeDelay: 0, LimitCount: 5, limit: 100, distance: 500, sort: 'Distance'})
        console.log(util.inspect(Output, false, null, true /* enable colors */))
    } catch (e) {
        console.log(e)
    }
}

main();