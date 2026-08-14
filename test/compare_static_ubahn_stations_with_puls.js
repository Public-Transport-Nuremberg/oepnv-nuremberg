/**
 * Example test: compare station key to API (PULS) Haltestellenname
 */
const bahnhoefe = require('../static/bahnhoefe-u-bahn.json');

describe('Compare station key to VAG API Haltestellenname', function () {
  this.timeout(10000);
  this.slow(2500);

  Object.entries(bahnhoefe).forEach(([stationNameKey, stationData]) => {
    it(`should match key "${stationNameKey}" to Haltestellenname`, async () => {
      const uBahnhofKurz = stationData['u-bahnhof_kurz'];

      const url = `https://start.vag.de/dm/api/v1/abfahrten/VAG/${uBahnhofKurz}`;
      const response = await fetch(url);
      const apiData = await response.json();

      const apiHaltestellenname = apiData.Haltestellenname
        ?.replace(/\s*\(.*\)/, '')
        .trim();

      const trimmedStationNameKey = stationNameKey.trim();
      if (apiHaltestellenname !== trimmedStationNameKey) {
        console.warn(
          `Station name mismatch for "${stationNameKey}": ` +
          `static key is "${trimmedStationNameKey}", VAG API returns "${apiHaltestellenname ?? '<nicht vorhanden>'}"`
        );
      }
    });
  });
});
