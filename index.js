const Haltestellen = require("./src/haltestellen");
const Abfahrten = require("./src/abfahrten");
const Fahrten = require("./src/fahrten");
const WebProcessor = require("./src/web_processor");
const allowed_apiparameter = {
    Departures: ["product", "timespan", "timedelay", "limitcount"],
    Stops: ["name", "lon", "lat", "distance"],
    Trips: ["timespan"]
    };

class openvgn {
    /**
     * 
     * @param {string} api_url Open Data VAG API URL
     * @param {string} vag_url EFA API
     */
    constructor(api_url, vag_url) {
        this.api_url = api_url || "https://start.vag.de/dm/api";
        this.vag_url = vag_url || "https://apigateway.vag.de/efa/";
    };

    urlReformat(value)
    {
        value = value.replace(/ä/g, "%C3%A4");
        value = value.replace(/ö/g, "%C3%B6");
        value = value.replace(/ü/g, "%C3%BC");
        return value;
    };
    /**
     * 
     * @param {Array} data 
     * @param {String} endpoint Departures, Stops
     * @returns 
     */
    encodeQueryData(data, endpoint) {
        const ret = [];
        for (let d in data){
            if(allowed_apiparameter[endpoint].includes(encodeURIComponent(d).toLowerCase())){
                ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
            };
        };
        return ret.join("&");
    };

    /**
     * @param {String} target Stop name
     * @param {Object} parameter Quary parameter
    */
    getStops(target, parameter) {
        const url = `${this.api_url}/haltestellen.json/vgn?name=${this.urlReformat(target.trim())}`;
        return Haltestellen.getStops(url, parameter).then(function(Haltestellen){
            return Haltestellen
        }).catch(function(err){
            return err;
        });
    };

    /**
     * @param {String} lat GPS Lat
     * @param {String} lon GPS Lon
     * @param {Object} parameter Quary parameter
    */
    getStopsbygps(lat, lon, parameter){
        if(!parameter.distance){
			parameter.distance = 500;
		};
		if(!parameter.sort){
			parameter.sort = "Distance";
		};
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`;
        return Haltestellen.getStopsbygps(url, lat, lon,parameter).then(function(Haltestellen){
            return Haltestellen;
        }).catch(function(err){
            return err;
        });
    };

    /**
     * @param {String} target Stop ID or VAG haltid
     * @param {Object} parameter Quary parameter
    */
    getDepartures(target, parameter){
        let source = "vgn";
        if(isNaN(target)){
            source = "vag";
        };
        let url = `${this.api_url}/abfahrten.json/${source}/${target}`;
        if(parameter){
			url = `${url}?${this.encodeQueryData(parameter, "Departures")}`;
		};
        return Abfahrten.getDepartures(url, parameter).then(function(Abfahrten){
            return Abfahrten;
        }).catch(function(err){
            return err;
        });
    };

    /**
     * 
     * @param {Number} lat GPS Lat
     * @param {Number} lon GPS Lon
     * @param {Object} parameter Quary parameter
     * @returns 
     */
    getDeparturesbygps(lat, lon, parameter){
        if(!parameter.distance){
            parameter.distance = 500;
        };
        if(!parameter.sort){
            parameter.sort = "Distance";
        };
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`;
        return Abfahrten.getDeparturesbygps(url, lat, lon, parameter, this.api_url, this.encodeQueryData).then(function(Abfahrten){
            return Abfahrten;
        }).catch(function(err){
            return err;
        });
    };

    /**
     * @param {Number} Fahrtnummer Fahrtnummer
     * @param {Object} parameter parameter
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
     * @param {Number} product Fahrtnummer
     * @param {Object} parameter Quary parameter
    */
     getTrips(product, parameter){
        let url = `${this.api_url}/fahrten.json/${product}`;

        if(parameter){
			url = `${url}?${this.encodeQueryData(parameter, "Trips")}`;
		};
        return Fahrten.getTrips(url).then(function(Fahrten){
            return Fahrten;
        }).catch(function(err){
            return err;
        });
    };

    /**
     * Function to scrape the VAG Webpage to return all ongoing delays, elevator outages and planned events as a object
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