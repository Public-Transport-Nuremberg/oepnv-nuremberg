const vgn_wrapper = require('../index');
const chai = require('chai');
const expect = chai.expect;


const api_url = "https://start.vag.de/dm/api";
const vag_url = "https://apigateway.vag.de/efa/";

const vgn = new vgn_wrapper.openvgn(api_url, vag_url);

describe('Stops API', function() {
    this.timeout(5000);
    this.slow(2000);

    it('getStops', async () => {
        const Output = await vgn.getStops('Pl', { limit: 2 })
        expect(Output).to.have.property('Stops').with.lengthOf(2);
        expect(Output).to.have.property('Meta');
    });

    it('getStopsbygps', async () => {
        const Output = await vgn.getStopsbygps('49.45015694', '11.083455', {limit: 3, distance: 400, sort: 'Distance'});
        expect(Output).to.have.property('Stops').with.lengthOf(3);
        expect(Output).to.have.property('Meta');
    });

});

describe('Departures API', function() {
    this.timeout(5000);
    this.slow(2000);

    it('getDepartures', async () => {
        const Output = await vgn.getDepartures("LO", {Product: "Ubahn", TimeSpan: 60, TimeDelay: 0, LimitCount: 2})
        expect(Output).to.have.property('Departures').with.lengthOf(2);
        expect(Output).to.have.property('Sonderinformationen');
        expect(Output).to.have.property('Meta');
    });

    it('getDeparturesbygps', async () => {
        const Output = await vgn.getDeparturesbygps('49.4480881582118', '11.0647882822154', {Product: "ubahn", TimeSpan: 20, TimeDelay: 0, LimitCount: 2, limit: 5, distance: 500, sort: 'Distance'})
        expect(Output).to.have.property('Stops').with.lengthOf(5);
        expect(Output.Stops[0].Abfahrten).to.have.property('Departures').with.lengthOf(2);
        expect(Output).to.have.property('Meta');
    });
    
});