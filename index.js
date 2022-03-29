const Haltestellen = require("./src/haltestellen");
const Abfahrten = require("./src/abfahrten");
const Fahrten = require("./src/fahrten");
const WebProcessor = require("./src/web_processor");
const {Fuhrpark_Bus, Fuhrpark_Tram, Steighoehen_Tram, StopInfo_Tram, StopInfo_Ubahn} = require("./static");
const allowed_apiparameter = {
    Departures: ["product", "timespan", "timedelay", "limitcount"],
    Stops: ["name", "lon", "lat", "distance"],
    Trips: ["timespan"]
    };

class openvgn {
    /**
     * Initialize VGN API
     * @param {string} [api_url] Open Data VAG API URL
     * @param {string} [vag_url] EFA API
     */
    constructor(api_url, vag_url) {
        this.api_url = api_url || "https://start.vag.de/dm/api";
        this.vag_url = vag_url || "https://apigateway.vag.de/efa/";
    };

    /**
     * This will replacae ä,ö,ü with the correct url encoding.
     * @param {String} value String to be encoded
     * @returns {String} Encoded String
     */
    #urlReformat(value)
    {
        value = value.replace(/ä/g, "%C3%A4");
        value = value.replace(/ö/g, "%C3%B6");
        value = value.replace(/ü/g, "%C3%BC");
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
        for (let d in data){
            if(allowed_apiparameter[endpoint].includes(encodeURIComponent(d).toLowerCase())){
                ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
            };
        };
        return ret.join("&");
    };

    /**
     * This will get you all known data about a stop.
     * @param {String} target Stop name
     * @param {Object} parameter Quary parameter
     * @param {Number} [parameter.limit] Max amount of stops returned
    */
    getStops(target, parameter) {
        const url = `${this.api_url}/haltestellen.json/vgn?name=${this.#urlReformat(target.trim())}`;
        return Haltestellen.getStops(url, parameter, {Steighoehen_Tram, StopInfo_Tram, StopInfo_Ubahn}).then(function(Haltestellen){
            return Haltestellen
        }).catch(function(err){
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
    getStopsbygps(lat, lon, parameter){
        if(!parameter.distance){
			parameter.distance = 500;
		};
		if(!parameter.sort){
			parameter.sort = "Distance";
		};
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`;
        return Haltestellen.getStopsbygps(url, lat, lon, parameter, {Steighoehen_Tram, StopInfo_Tram, StopInfo_Ubahn}).then(function(Haltestellen){
            return Haltestellen;
        }).catch(function(err){
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
    getDepartures(target, parameter){
        let source = "vgn";
        if(isNaN(target)){
            source = "vag";
        };
        let url = `${this.api_url}/abfahrten.json/${source}/${target}`;
        if(parameter){
			url = `${url}?${this.#encodeQueryData(parameter, "Departures")}`;
		};
        return Abfahrten.getDepartures(url, parameter).then(function(Abfahrten){
            return Abfahrten;
        }).catch(function(err){
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
    getDeparturesbygps(lat, lon, parameter){
        if(!parameter.distance){
            parameter.distance = 500;
        };
        if(!parameter.sort){
            parameter.sort = "Distance";
        };
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`;
        return Abfahrten.getDeparturesbygps(url, lat, lon, parameter, this.api_url, this.#encodeQueryData).then(function(Abfahrten){
            return Abfahrten;
        }).catch(function(err){
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
     getTrip(Fahrtnummer, parameter){
        let url;
        if(parameter.date){
            const date = new Date(parameter.date).toLocaleTimeString("de-DE", {day: "2-digit", month: "2-digit", year: "numeric"}).split(",")[0];
            url = `${this.api_url}/fahrten.json/${parameter.product}/${date}/${Fahrtnummer}`;
        }else{
            url = `${this.api_url}/fahrten.json/${parameter.product}/${Fahrtnummer}`;
        };
        return Fahrten.getTrips(url).then(function(Fahrten){
            return Fahrten;
        }).catch(function(err){
            return err;
        });
    };

    /**
     * This will list all trips of the given product (Ubahn, Tram, Bus) in a given timespan.
     * @param {Number} product Fahrtnummer
     * @param {Object} parameter Quary parameter
     * @param {Number} [parameter.TimeSpan] Return departures until that time
    */
     getTrips(product, parameter){
        let url = `${this.api_url}/fahrten.json/${product}`;

        if(parameter){
			url = `${url}?${this.#encodeQueryData(parameter, "Trips")}`;
		};
        return Fahrten.getTrips(url).then(function(Fahrten){
            return Fahrten;
        }).catch(function(err){
            return err;
        });
    };

    /**
     * Function to scrape the VAG Webpage to return all ongoing delays, elevator outages and planned events as a object
     * @param {String} [test] You can give it a old HTML file to parse, if nothing is passed it will scrape the VAG Webpage
     * @returns Object
     */
    getVagWebpageDisturbances(test){
        return WebProcessor.getVagWebpageDisturbances(test).then(function(Oobject){
            return Oobject;
        }).catch(function(err){
            return err;
        });
    };

};

module.exports = {
	openvgn
};