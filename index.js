const Haltestellen = require('./src/haltestellen')
const Abfahrten = require('./src/abfahrten')

class openvgn {
    constructor(api_url, vag_url) {
        this.api_url = api_url || "https://start.vag.de/dm/api";
        this.vag_url = vag_url || "https://apigateway.vag.de/efa/";
    }

    urlReformat(value)
    {
        value = value.replace(/ä/g, "%C3%A4");
        value = value.replace(/ö/g, "%C3%B6");
        value = value.replace(/ü/g, "%C3%BC");
        return value;
    }

    urlReformatPHP(value)
    {
        value = value.replace(/ /g, "+");
        return value;
    }

    encodeQueryData(data) {
        const ret = [];
        for (let d in data)
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
        return ret.join('&');
    }

    /**
     * @param {String} target 
     * @param {Object} parameter 
    */
    getStops(target, parameter) {
        const url = `${this.api_url}/haltestellen.json/vgn?name=${this.urlReformat(target.trim())}`
        return Haltestellen.getStops(url, parameter).then(function(Haltestellen){
            return Haltestellen
        }).catch(function(err){
            return err
        })
    }

    /**
     * @param {String} lat
     * @param {String} lon 
     * @param {Object} parameter 
    */
    getStopsbygps(lat, lon, parameter){
        if(!parameter.distance){
			parameter.distance = 500;
		}
		if(!parameter.sort){
			parameter.sort = "Distance";
		}
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`
        return Haltestellen.getStopsbygps(url, lat, lon,parameter).then(function(Haltestellen){
            return Haltestellen
        }).catch(function(err){
            return err
        })
    }

    /**
     * @param {String} target 
     * @param {Object} parameter 
    */
    getDepartures(target){
        let url = `${this.api_url}/abfahrten.json/vgn/${target}`
        if(parameter){
			url = `${url}?${this.encodeQueryData(parameter)}`
		}
        return Abfahrten.getDepartures(url, parameter).then(function(Abfahrten){
            return Abfahrten
        }).catch(function(err){
            return err
        })
    }

    getDeparturesbygps(lat, lon, parameter){
        if(!parameter.distance){
            parameter.distance = 500;
        }
        if(!parameter.sort){
            parameter.sort = "Distance";
        }
        const url = `${this.api_url}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`
        return Abfahrten.getDeparturesbygps(url, lat, lon, parameter, this.api_url, this.encodeQueryData).then(function(Abfahrten){
            return Abfahrten
        }).catch(function(err){
            return err
        })
    }
}

module.exports = {
	openvgn
};