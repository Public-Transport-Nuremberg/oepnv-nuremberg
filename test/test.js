const vgn_wrapper = require('../index');
const chai = require('chai');
const fs = require('fs')
const expect = chai.expect;


const api_url = "https://start.vag.de/dm/api";
const vag_url = "https://apigateway.vag.de/efa/";

const vgn = new vgn_wrapper.openvgn(api_url, vag_url);

describe('Stops API', function () {
    this.timeout(15000);
    this.slow(100);

    it('getStops', async () => {
        const Output = await vgn.getStops('Pl', { limit: 2 })
        expect(Output).to.have.property('Stops').with.lengthOf(2);
        expect(Output).to.have.property('Meta');
    });

    it('getStopsbygps', async () => {
        const Output = await vgn.getStopsbygps('49.45015694', '11.083455', { limit: 3, distance: 400, sort: 'Distance' });
        expect(Output).to.have.property('Stops').with.lengthOf(3);
        expect(Output).to.have.property('Meta');
    });

});

describe('Departures API', function () {
    this.timeout(15000);
    this.slow(100);

    it('getDepartures', async () => {
        const Output = await vgn.getDepartures("LO", { Product: "Ubahn", TimeSpan: 60, TimeDelay: 0, LimitCount: 2 })
        expect(Output).to.have.property('Departures').with.lengthOf(2);
        expect(Output).to.have.property('Sonderinformationen');
        expect(Output).to.have.property('Meta');
    });

    it('getDeparturesbygps', async () => {
        const Output = await vgn.getDeparturesbygps('49.4480881582118', '11.0647882822154', { Product: "ubahn", TimeSpan: 20, TimeDelay: 0, LimitCount: 2, limit: 5, distance: 500, sort: 'Distance' })
        expect(Output).to.have.property('Stops').with.lengthOf(5);
        expect(Output.Stops[0].Abfahrten).to.have.property('Departures').with.lengthOf(2);
        expect(Output).to.have.property('Meta');
    });

});

describe('Trips API', function () {
    this.timeout(15000);
    this.slow(100);

    it('getTrip', async () => {
        const CurrentDeparture = await vgn.getDepartures("PL", { Product: "Ubahn", TimeSpan: 60, TimeDelay: 0, LimitCount: 2 })
        const Output = await vgn.getTrip(CurrentDeparture.Departures[0].Fahrtnummer, { product: "Ubahn" })
        expect(Output.Fahrt).to.have.property('Fahrtverlauf');
        expect(Output).to.have.property('Meta');
    });

    it('getTrips', async () => {
        const Output = await vgn.getTrips("Ubahn", { timespan: 120 })
        expect(Output.Fahrt).to.have.property('Fahrten');
        expect(Output).to.have.property('Meta');
    });
})


fs.readdir("./test/VAGHtmlTestTemplates", function (err, filenames) {
    if (err) { console.log(err); }
    describe('Webprocessor', function () {
        this.timeout(15000);
        this.slow(100);

        //Just test if the URL still works
        it('getVagWebpageDisturbances', async () => {
            const Output = await vgn.getVagWebpageDisturbances();
            expect(Output).to.have.property('Meta');
        });
        /*

        //Test the parser against static html files that have a expected output
        //The .txt files contain the HTML of the Webpage and the .json the expected output.
        
        for (i = 0; i < filenames.length; i++) {
            if (filenames[i].endsWith(".txt")) {
                const rawdata = fs.readFileSync(`./test/VAGHtmlTestTemplates/${filenames[i]}`);
                const expected = fs.readFileSync(`./test/VAGHtmlTestTemplates/${filenames[i]}.json`);
                const prot = JSON.parse(expected);

                it(`getVagWebpageDisturbances ${filenames[i]}`, async () => {
                    const Output = await vgn.getVagWebpageDisturbances(rawdata);
                    expect(Output.Meta).to.have.property('Timestamp');
                    expect(Output.Meta).to.have.property('RequestTime');
                    expect(Output.Meta).to.have.property('ParseTime');
                    expect(Output.Meta).to.have.property('URL');
                    //Remove Metadata because it is not expected to be the same
                    delete Output.Meta
                    delete prot.Meta
                    expect(JSON.stringify(Output)).to.equal(JSON.stringify(prot));
                });
            }
        }
        */
    });
});