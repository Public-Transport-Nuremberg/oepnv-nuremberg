const assert = require('assert');
const { openvgn } = require('../index');

describe('Live vehicle and elevator APIs', function () {
    const vgn = new openvgn();
    let originalFetch;

    beforeEach(function () {
        originalFetch = global.fetch;
    });

    afterEach(function () {
        global.fetch = originalFetch;
    });

    it('bridges WGS84 bounds and positions to MRCV while preserving vehicle fields', async () => {
        const vehicles = [{
            ID: 'vehicle', X: '1226740.7885418746', Y: '5641583.147033509', Delay: -82,
            XPrevious: '0', YPrevious: '12000000'
        }];
        global.fetch = async (url) => {
            const query = new URL(url).searchParams;
            assert.strictEqual(new URL(url).origin, 'https://vis.defas-fgi.de');
            assert.strictEqual(query.get('CoordSystem'), 'MRCV');
            assert.ok(Math.abs(Number(query.get('MinX')) - 1226740.7885418746) < 0.001);
            assert.ok(Math.abs(Number(query.get('MinY')) - 5641583.147033509) < 0.001);
            assert.ok(Number(query.get('MinX')) < Number(query.get('MaxX')));
            // MRCV Y increases southwards, so the northern latitude is MinY.
            assert.ok(Number(query.get('MinY')) < Number(query.get('MaxY')));
            assert.strictEqual(query.get('MOTCode'), '4,5');
            assert.strictEqual(query.get('ID'), 'vehicle');
            assert.strictEqual(query.get('JourneyIdentifier'), 'van:02051:_:H:j26:461');
            assert.strictEqual(query.has('ignored'), false);
            return new Response(JSON.stringify(vehicles), { headers: { 'Content-Type': 'application/json' } });
        };

        const output = await vgn.getVehicles({
            west: 11.02, south: 49.42, east: 11.13, north: 49.49,
            MOTCode: '4,5', ID: 'vehicle', JourneyIdentifier: 'van:02051:_:H:j26:461', ignored: true
        });
        const vehicle = output.Vehicles[0];
        for (const key of Object.keys(vehicles[0])) assert.strictEqual(vehicle[key], vehicles[0][key]);
        assert.ok(Math.abs(vehicle.Longitude - 11.02) < 1e-9);
        assert.ok(Math.abs(vehicle.Latitude - 49.49) < 1e-9);
        assert.ok(Math.abs(vehicle.LongitudePrevious) < 1e-9);
        assert.ok(Math.abs(vehicle.LatitudePrevious) < 1e-9);
        assert.strictEqual(typeof output.Meta.RequestTime, 'number');
        assert.ok(output.Meta.URL.includes('JourneyIdentifier=van%3A'));
    });

    it('accepts zero and numeric string WGS84 bounds', async () => {
        global.fetch = async (url) => {
            const query = new URL(url).searchParams;
            assert.ok(Math.abs(Number(query.get('MaxX'))) < 1e-9);
            assert.ok(Math.abs(Number(query.get('MinY')) - 12000000) < 1e-9);
            assert.ok(Number(query.get('MinX')) < 0);
            assert.ok(Number(query.get('MaxY')) > 12000000);
            return new Response('[]');
        };
        assert.deepStrictEqual((await vgn.getVehicles({west: '-1', south: '-1', east: 0, north: 0})).Vehicles, []);
    });

    it('supports journey queries without a bounding box', async () => {
        global.fetch = async (url) => {
            const query = new URL(url).searchParams;
            assert.strictEqual(query.get('JourneyIdentifier'), 'journey');
            for (const key of ['MinX', 'MinY', 'MaxX', 'MaxY']) assert.strictEqual(query.has(key), false);
            return new Response('[]');
        };
        assert.deepStrictEqual((await vgn.getVehicles({JourneyIdentifier: 'journey'})).Vehicles, []);
    });

    it('rejects partial, invalid, reversed and unprojectable WGS84 bounds before fetching', async () => {
        global.fetch = async () => { throw new Error('Unexpected HTTP request'); };
        const bounds = {west: 11.02, south: 49.42, east: 11.13, north: 49.49};
        for (const invalid of [
            {west: 11.02}, {...bounds, west: ''}, {...bounds, west: null}, {...bounds, west: NaN},
            {...bounds, north: Infinity}, {...bounds, east: 181}, {...bounds, west: -181},
            {...bounds, north: 90}, {...bounds, south: -90}, {...bounds, west: 12},
            {...bounds, south: 50}, {...bounds, east: bounds.west}, {...bounds, north: bounds.south}
        ]) {
            assert.ok(vgn.getVehicles(invalid) instanceof Error);
        }
    });

    it('uses null WGS84 positions for missing or invalid MRCV coordinates', async () => {
        const vehicles = [
            {}, {X: null, Y: '12000000'}, {X: '', Y: '12000000'},
            {X: 'invalid', Y: '12000000'}, {X: '0', Y: 'Infinity'},
            {X: '0', Y: '12000000', XPrevious: '0'}
        ];
        global.fetch = async () => new Response(JSON.stringify(vehicles));
        const output = await vgn.getVehicles();
        for (const vehicle of output.Vehicles.slice(0, -1)) {
            assert.strictEqual(vehicle.Latitude, null);
            assert.strictEqual(vehicle.Longitude, null);
        }
        const vehicle = output.Vehicles[5];
        assert.ok(Math.abs(vehicle.Latitude) < 1e-9);
        assert.strictEqual(vehicle.Longitude, 0);
        assert.strictEqual(vehicle.LatitudePrevious, null);
        assert.strictEqual(vehicle.LongitudePrevious, null);
    });

    it('requests elevator status with the tenant and German language', async () => {
        const elevators = [{ id: 71000141, station: 'Stadtgrenze', state: 'malfunction' }];
        global.fetch = async (url, options) => {
            assert.strictEqual(new URL(url).pathname, '/srs/api/v1/elevatorInfo');
            assert.strictEqual(new URL(url).searchParams.get('tenant'), 'vagn');
            assert.strictEqual(options.headers['Accept-Language'], 'de');
            assert.strictEqual(options.method, 'GET');
            return new Response(JSON.stringify(elevators), { headers: { 'Content-Type': 'application/json' } });
        };

        const output = await vgn.getElevatorInfo();
        assert.deepStrictEqual(output.Elevators, elevators);
        assert.strictEqual(typeof output.Meta.RequestTime, 'number');
        assert.ok(output.Meta.URL.includes('tenant=vagn'));
    });

    for (const [method, key] of [['getVehicles', 'Vehicles'], ['getElevatorInfo', 'Elevators']]) {
        it(`${method} accepts an empty JSON array without a JSON content type`, async () => {
            global.fetch = async () => new Response('[]');
            const output = await vgn[method]();
            assert.deepStrictEqual(output[key], []);
        });

        it(`${method} returns HTTP errors in the existing wrapper style`, async () => {
            global.fetch = async () => new Response(JSON.stringify({ message: 'Unavailable' }), {
                status: 503, headers: { 'Content-Type': 'application/json' }
            });
            const output = await vgn[method]();
            assert.strictEqual(output.code, 503);
            assert.strictEqual(output.message, 'Unavailable');
            assert.strictEqual(typeof output.url, 'string');
        });

        it(`${method} returns transport errors`, async () => {
            const error = new Error('Network unavailable');
            global.fetch = async () => { throw error; };
            assert.strictEqual(await vgn[method](), error);
        });

        it(`${method} returns an error for an unexpected response shape`, async () => {
            global.fetch = async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } });
            assert.ok(await vgn[method]() instanceof Error);
        });

        it(`${method} returns an error for malformed JSON`, async () => {
            global.fetch = async () => new Response('{', { headers: { 'Content-Type': 'application/json' } });
            assert.ok(await vgn[method]() instanceof Error);
        });
    }
});
