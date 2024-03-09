const Haltestellen = require("./src/haltestellen");
const Abfahrten = require("./src/abfahrten");
const Fahrten = require("./src/fahrten");
const WebProcessor = require("./src/web_processor");
const routen = require("./src/routen")
const reverseGeocode = require("./src/reversegeocord")
const { Fuhrpark_Bus, Fuhrpark_Tram, Fuhrpark_PVU, Steighoehen_Tram, StopInfo_Tram, StopInfo_Ubahn } = require("./static");
const allowed_apiparameter = {
    Departures: ["product", "timespan", "timedelay", "limitcount"],
    Stops: ["name", "lon", "lat", "distance"],
    Trips: ["timespan"],
    Locations: ["name"]
};

class openvgn {
    /**
     * Initialize VGN API
     * @param {string} [api_url] Open Data VAG API URL
     * @param {string} [vag_url] EFA API
     */
    constructor(api_url, vag_url) {
        this.api_url = api_url || "https://start.vag.de/dm/api";
        this.vag_url = vag_url || "https://efa-gateway.vag.de";
        this.map_and_route_url = "https://iw.mapandroute.de/MapAPI-1.3//servlet/FrontController";
    };

    /**
     * This will replacae ä,ö,ü with the correct url encoding.
     * @param {String} value String to be encoded
     * @returns {String} Encoded String
     */
    #urlReformat(value) {
        value = value.replace(/ä/g, "%C3%A4");
        value = value.replace(/Ä/g, "%C3%84");
        value = value.replace(/ö/g, "%C3%B6");
        value = value.replace(/Ö/g, "%C3%96");
        value = value.replace(/ü/g, "%C3%BC");
        value = value.replace(/Ü/g, "%C3%9C");
        value = value.replace(/ß/g, "%C3%9F");
        return value;
    };
    /**
     * This will encode the given parameter to a query string.
     * @param {String[]} data 
     * @param {String} endpoint Departures, Stops, Trips
     * @returns {String} Encoded String
     */
    #encodeQueryData(data, endpoint) {
        const ret = [];
        for (let d in data) {
            if (allowed_apiparameter[endpoint].includes(encodeURIComponent(d).toLowerCase())) {
                ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
            };
        };
        return ret.join("&");
    };

    #XYtoWGS84(ll) {
        //Constats for convertion
        const D2R = Math.PI / 180;
        const A = 6378137.0;
        const MAXEXTENT = 20037508.342789244;

        const xy = [
            A * ll[0] * D2R,
            A * Math.log(Math.tan((Math.PI * 0.25) + (0.5 * ll[1] * D2R)))
        ];
        // if xy value is beyond maxextent (e.g. poles), return maxextent.
        (xy[0] > MAXEXTENT) && (xy[0] = MAXEXTENT);
        (xy[0] < -MAXEXTENT) && (xy[0] = -MAXEXTENT);
        (xy[1] > MAXEXTENT) && (xy[1] = MAXEXTENT);
        (xy[1] < -MAXEXTENT) && (xy[1] = -MAXEXTENT);
        return xy;
    };


    /**
     * Transform coordinates into a string that can be used for routes.
     * @param {Number} lat 
     * @param {Number} lon 
     * @returns 
     */
    getCordString(lat, lon) {
        if (!lat || !lon) { return new Error("getDeparturesbygps: Coordinates can´t be empty.") }
        return `${lat}:${lon}:WGS84[DD.DDDDD]`
    }

    /**
     * This will get you all known data about a stop.
     * @param {String} target Stop name
     * @param {Object} parameter Quary parameter
     * @param {Number} [parameter.limit] Max amount of stops returned
    */
    getStops(target, parameter) {
        if (!target) { return new Error("getDepartures: Target can´t be empty.") }
        const url = `${this.api_url}/haltestellen.json/vgn?name=${this.#urlReformat(target.trim())}`;
        return Haltestellen.getStops(url, parameter, { Steighoehen_Tram, StopInfo_Tram, StopInfo_Ubahn }).then(function (Haltestellen) {
            return Haltestellen
        }).catch(function (err) {
            return err;
        });
    };

    /**
     * This will list all stops in a given radius.
     * @param {String} lat GPS Lat
     * @param {String} lon GPS Lon
     * @param {Object} parameter Quary parameter
     * @param {Number} [parameter.limit] Max amount of stops returned
     * @param {Number} [parameter.distance] Max distance to given GPS Position
     * @param {String} [parameter.sort] Sort your stops by distance or alphabetically
    */
    getStopsbygps(lat, lon, parameter) {
        if (!lat || !lon) { return new Error("getDeparturesbygps: Coordinates can´t be empty.") }
        if (!parameter.distance) {
            parameter.distance = 500;
        };
        if (!parameter.sort) {
            parameter.sort = "Distance";
        };
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`;
        return Haltestellen.getStopsbygps(url, lat, lon, parameter, { Steighoehen_Tram, StopInfo_Tram, StopInfo_Ubahn }).then(function (Haltestellen) {
            return Haltestellen;
        }).catch(function (err) {
            return err;
        });
    };

    /**
     * This will list all departures from a given stop.
     * @param {String} target Stop ID or VAG haltid
     * @param {Object} parameter Quary parameter
     * @param {String} [parameter.Product] Only return departures of one or multiple products
     * @param {Number} [parameter.TimeSpan] Return departures until that time
     * @param {Number} [parameter.TimeDelay] Look for now + x in minutes
     * @param {Number} [parameter.LimitCount] Max amount of departures returned
    */
    getDepartures(target, parameter) {
        if (!target) { return new Error("getDepartures: Target can´t be empty.") }
        let source = "vgn";
        if (isNaN(target)) {
            source = "vag";
        };
        let url = `${this.api_url}/abfahrten.json/${source}/${target}`;
        if (parameter) {
            url = `${url}?${this.#encodeQueryData(parameter, "Departures")}`;
        };
        return Abfahrten.getDepartures(url, { Fuhrpark_Tram, Fuhrpark_Bus }).then(function (Abfahrten) {
            return Abfahrten;
        }).catch(function (err) {
            return err;
        });
    };

    /**
     * This will list all stops with departure data in a given radius.
     * @param {Number} lat GPS Lat
     * @param {Number} lon GPS Lon
     * @param {Object} parameter Quary parameter
     * @param {Number} [parameter.limit] Max amount of stops returned
     * @param {Number} [parameter.distance] Max distance to given GPS Position
     * @param {String} [parameter.sort] Sort your stops by distance or alphabetically
     * @param {String} [parameter.Product] Only return departures of one or multiple products
     * @param {Number} [parameter.TimeSpan] Return departures until that time
     * @param {Number} [parameter.TimeDelay] Look for now + x in minutes
     * @param {Number} [parameter.LimitCount] Max amount of departures returned
     */
    getDeparturesbygps(lat, lon, parameter) {
        if (!lat || !lon) { return new Error("getDeparturesbygps: Coordinates can´t be empty.") }
        if (!parameter.distance) {
            parameter.distance = 500;
        };
        if (!parameter.sort) {
            parameter.sort = "Distance";
        };
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`;
        return Abfahrten.getDeparturesbygps(url, lat, lon, parameter, this.api_url, this.#encodeQueryData, { Fuhrpark_Tram, Fuhrpark_Bus, Fuhrpark_PVU }).then(function (Abfahrten) {
            return Abfahrten;
        }).catch(function (err) {
            return err;
        });
    };

    /**
     * This will display all stations that the product has and will pass from start to finish.
     * You can get the number (Fahrtnummer) from a getDepartures call.
     * @param {Number} Fahrtnummer Fahrtnummer
     * @param {Object} parameter parameter
     * @param {String} [parameter.Product] Only return departures of one or multiple products
    */
    getTrip(Fahrtnummer, parameter) {
        if (!Fahrtnummer) { return new Error("getTrip: Fahrtnummer can´t be empty.") }
        let url;
        if (parameter.date) {
            url = `${this.api_url}/fahrten.json/${parameter.product}/${parameter.date}/${Fahrtnummer}`;
        } else {
            url = `${this.api_url}/fahrten.json/${parameter.product}/${Fahrtnummer}`;
        };
        return Fahrten.getTrips(url).then(function (Fahrten) {
            return Fahrten;
        }).catch(function (err) {
            return err;
        });
    };

    /**
     * This will list all trips of the given product (Ubahn, Tram, Bus) in a given timespan.
     * @param {Number} product Fahrtnummer
     * @param {Object} parameter Quary parameter
     * @param {Number} [parameter.TimeSpan] Return departures until that time
    */
    getTrips(product, parameter) {
        if (!product) { return new Error("getTrips: Product can´t be empty.") }
        let url = `${this.api_url}/fahrten.json/${product}`;

        if (parameter) {
            url = `${url}?${this.#encodeQueryData(parameter, "Trips")}`;
        };
        return Fahrten.getTrips(url).then(function (Fahrten) {
            return Fahrten;
        }).catch(function (err) {
            return err;
        });
    };

    /**
     * Function to scrape the VAG Webpage to return all ongoing delays, elevator outages and planned events as a object
     * @param {String} [test] You can give it a old HTML file to parse, if nothing is passed it will scrape the VAG Webpage
     * @returns Object
     */
    getVagWebpageDisturbances(test) {
        return WebProcessor.getVagWebpageDisturbances(test).then(function (Oobject) {
            return Oobject;
        }).catch(function (err) {
            return err;
        });
    };

    getLocations(name) {
        if (!name) { return new Error("getLocations: Name can´t be empty.") }
        const url = `${this.vag_url}/api/v1/locations?name=${name}`
        return routen.getLocations(url).then(function (locations) {
            return locations;
        }).catch(function (err) {
            return err;
        });
    }

    /**
     * Will convert a given GPS location to a Adress
     * @param {Number} lat GPS Lat
     * @param {Number} lon GPS Lon
     */
    reverseGeocode(lat, lon) {
        if (!lat || !lon) { return new Error("reverseGeocode: Coordinates can´t be empty.") }
        const xy = this.#XYtoWGS84([lon, lat]);
        const url = `${this.map_and_route_url}?cmd=reverseGeocode&VNR=0&PNR=0&country=EU&x=${xy[0]}&y=${xy[1]}&hits=1`;
        return reverseGeocode.reverseGeocode(url).then(function (locations) {
            return locations;
        }).catch(function (err) {
            return err;
        });
    }

    /**
     * Will calculate the time it takes to get from A to B from a getTrip response
     * Uses Expected (SOLL) data
     * @param {Object} trip getTrip response
     * @param {Number|String} start Start Station
     * @param {Number|String} end End Station
     * @returns {Number} Time in seconds
     */
    calculateTripTime(trip, start, end) {
        if (!trip) { return new Error("calculateTripTime: Trip can´t be empty.") }
        let start_time, end_time;
        trip.Fahrt.Fahrtverlauf.forEach(function (stop) {
            if (stop.VAGKennung === start || stop.VGNKennung == start) {
                start_time = new Date(stop.AbfahrtszeitSoll || stop.AnkunftszeitSoll).getTime();
            };

            if (stop.VAGKennung === end || stop.VGNKennung == end) {
                end_time = new Date(stop.AnkunftszeitSoll || stop.AbfahrtszeitSoll).getTime();
            };
        });

        const time = end_time - start_time;
        if (time.isNaN) {
            return new Error("calculateTripTime: Start or End Station not found.");
        } else {
            return time / 1000;
        }
    }

    /**
     * Will calculate the time it actualy took to get from A to B from a getTrip response
     * Uses Actual (IST) data
     * @param {Object} trip getTrip response
     * @param {Number|String} start Start Station
     * @param {Number|String} end End Station
     * @returns {Number} Time in seconds
     */
    calculateActualTripTime(trip, start, end) {
        if (!trip) { return new Error("calculateTripTime: Trip can´t be empty.") }
        let start_time, end_time;
        trip.Fahrt.Fahrtverlauf.forEach(function (stop) {
            if (stop.VAGKennung === start || stop.VGNKennung == start) {
                start_time = new Date(stop.AbfahrtszeitIst || stop.AnkunftszeitIst).getTime();
            };

            if (stop.VAGKennung === end || stop.VGNKennung == end) {
                end_time = new Date(stop.AnkunftszeitIst || stop.AbfahrtszeitIst).getTime();
            };
        });

        const time = end_time - start_time;
        if (time.isNaN) {
            return new Error("calculateTripTime: Start or End Station not found.");
        } else {
            return time / 1000;
        }
    }

};

module.exports = {
    openvgn
};