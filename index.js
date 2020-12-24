const VAGDE = "https://start.vag.de/dm/api";
//https://start.vag.de/dm/api/haltestellen.json/vgn?name=Plärrer

const HPSSuggest = "https://www.vgn.de/ib/site/tools/HPSSuggest.php";
//https://www.vgn.de/ib/site/tools/HPSSuggest.php?query={QueryString}&gps=1&Edition=de

const VGNDE = "https://www.vgn.de/verbindungen/";
//https://www.vgn.de/verbindungen/?to=de%3A09564%3A704&td=coord%3A4440209.72739%3A686069.44855%3ANAV4%3AN%C3%BCrnberg%2C%20Leithastra%C3%9Fe

const request = require("request");
const geolib = require("geolib");

function urlReformat(value)
{
    value = value.replace(/ä/g, "%C3%A4");
    value = value.replace(/ö/g, "%C3%B6");
    value = value.replace(/ü/g, "%C3%BC");
    return value;
}

function encodeQueryData(data) {
	const ret = [];
	for (let d in data)
	  ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
	return ret.join('&');
 }

/* Haltestellen VAG API */

/**
 * 
 * @param {String} mame 
 * @param {Object} parameter 
 */

let getStops = function(mame, parameter) {
	return new Promise(function(resolve, reject) {
		var url = `${VAGDE}/haltestellen.json/vgn?name=${urlReformat(mame.trim())}`
		request(url, { json: true }, (err, res, body) => {
			if (err) { reject(err); }
			try {
				if(res.statusCode === 200){
					body.Haltestellen.map((Haltestellen) => {
						let HaltestellennameSplit = Haltestellen.Haltestellenname.split("(");
						Haltestellen.Haltestellenname = HaltestellennameSplit[0].trim();
						Haltestellen.Ort = HaltestellennameSplit[1].replace(/[)]/g,"",);;
						Haltestellen.Produkte = Haltestellen.Produkte.replace(/ubahn/i,"U-Bahn",);
					});
					if(parameter){
						if(parameter.limit){
							resolve(body.Haltestellen.slice(0, parameter.limit));
						}
					}else{
						resolve(body.Haltestellen);
					}
				}else{
					reject(res.statusCode)
				}
			} catch (error) {
				if(error instanceof TypeError){
					reject("Bad response from API");
				}
				reject(error);
			}
  
		});
	});
}

/**
 * 
 * @param {String} lat 
 * @param {String} lon 
 * @param {Object} parameter 
 */

let getStopsbygps = function(lat, lon, parameter) {
	return new Promise(function(resolve, reject) {
		console.log(lat,lon,parameter)
		if(!parameter.distance){
			parameter.distance = 500;
		}
		if(!parameter.sort){
			parameter.sort = "Distance";
		}
		var url = `${VAGDE}/haltestellen.json/vgn?lon=${lon}&lat=${lat}&Distance=${parameter.distance}`
		request(url, { json: true }, (err, res, body) => {
			if (err) { reject(err); }
			try {
				if(res.statusCode === 200){
					body.Haltestellen.map((Haltestellen) => {
						Haltestellen.Distance = geolib.getDistance(
							{ latitude: lat, longitude: lon },
							{ latitude: Haltestellen.Latitude, longitude: Haltestellen.Longitude }
						);
						let HaltestellennameSplit = Haltestellen.Haltestellenname.split("(");
						Haltestellen.Haltestellenname = HaltestellennameSplit[0].trim();
						Haltestellen.Ort = HaltestellennameSplit[1].replace(/[)]/g,"",);
						Haltestellen.Produkte = Haltestellen.Produkte.replace(/ubahn/i,"U-Bahn",);
					});
					if(parameter.sort.toLowerCase() === "distance"){body.Haltestellen.sort((a, b) => (a.Distance > b.Distance) ? 1 : -1)};
					if(parameter.sort.toLowerCase() === "alphabetically"){body.Haltestellen.sort((a, b) => (a.Haltestellenname > b.Haltestellenname) ? 1 : -1)};
					if(parameter){
						if(parameter.limit){
							resolve(body.Haltestellen.slice(0, parameter.limit));
						}
					}else{
						resolve(body.Haltestellen);
					}
				}else{
					reject(res.statusCode)
				}
			} catch (error) {
				if(error instanceof TypeError){
					reject("Bad response from API");
				}
				reject(error);
			}
		});
	});

}

/**
 * 
 * @param {Number} ID 
 * @param {Object} parameter 
 */

let getDepartures = function(ID, parameter) {
	return new Promise(function(resolve, reject) {
		var url = `${VAGDE}/abfahrten.json/vgn/${ID}`
		if(parameter){
			url = `${url}?${encodeQueryData(parameter)}`
		}
		request(url, { json: true }, (err, res, body) => {
			if (err) { 
			resolve(err.code);		
			return err; 
			}
			body.Abfahrten.map((Abfahrten) =>{
				Abfahrten.Produkt = Abfahrten.Produkt.replace(/ubahn/i,"U-Bahn",);
				AbfahrtZeitSollArray = Abfahrten.AbfahrtszeitSoll;
				AbfahrtZeitSollArray = AbfahrtZeitSollArray.split("+");
				AbfahrtZeitSollArray = AbfahrtZeitSollArray[0].split("T");
				AbfahrtZeitSollArrayDatum = AbfahrtZeitSollArray[0].split("-");
				AbfahrtZeitSollArrayZeit = AbfahrtZeitSollArray[1].split(":");
				AbfahrtZeitSollArrayDatum = AbfahrtZeitSollArrayDatum[1] + "/" + AbfahrtZeitSollArrayDatum[2] + "/" + AbfahrtZeitSollArrayDatum[0]
				AbfahrtZeitSollArrayZeitUnix = new Date(AbfahrtZeitSollArrayDatum).getTime() + AbfahrtZeitSollArrayZeit[0] * 60 * 60 * 1000 + AbfahrtZeitSollArrayZeit[1] * 60 * 1000 + AbfahrtZeitSollArrayZeit[2] * 1000 + 60 * 60 * 1000

				AbfahrtZeitIstArray = Abfahrten.AbfahrtszeitIst;
				AbfahrtZeitIstArray = AbfahrtZeitIstArray.split("+");
				AbfahrtZeitIstArray = AbfahrtZeitIstArray[0].split("T");
				AbfahrtZeitIstArrayDatum = AbfahrtZeitIstArray[0].split("-");
				AbfahrtZeitIstArrayZeit = AbfahrtZeitIstArray[1].split(":");
				AbfahrtZeitIstArrayDatum = AbfahrtZeitIstArrayDatum[1] + "/" + AbfahrtZeitIstArrayDatum[2] + "/" + AbfahrtZeitIstArrayDatum[0]
				AbfahrtZeitIstArrayZeitUnix = new Date(AbfahrtZeitIstArrayDatum).getTime() + AbfahrtZeitIstArrayZeit[0] * 60 * 60 * 1000 + AbfahrtZeitIstArrayZeit[1] * 60 * 1000 + AbfahrtZeitIstArrayZeit[2] * 1000 + 60 * 60 * 1000
										
				Abfahrten.AbfahrtZeitSoll = AbfahrtZeitSollArray[1]
				Abfahrten.Verspätung = (AbfahrtZeitIstArrayZeitUnix - AbfahrtZeitSollArrayZeitUnix)/1000
			});
			resolve(body.Abfahrten);
		});
	});
}

module.exports = {
	getStops,
	getStopsbygps,
	getDepartures
};