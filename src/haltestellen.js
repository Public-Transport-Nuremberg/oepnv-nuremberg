const request = require("request");
const geolib = require("geolib");
const os = require('os');
const package = require('../package.json');

const customHeaderRequest = request.defaults({
    headers: {'User-Agent': `OpenVGN/${package.version} (NodeJS_${process.env.NODE_VERSION}) ${os.platform()} (${os.arch()}) NodeJS Wrapper`}
})

/**
 * @param {String} url 
 * @param {Object} parameter 
 */
 let getStops = function(url, parameter) {
	return new Promise(function(resolve, reject) {
		let Time_Started = new Date().getTime();
		customHeaderRequest(url, { json: true }, (err, res, body) => {
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
							body.Metadata.RequestTime = new Date().getTime() - Time_Started
							body.Metadata.URL = url
							resolve({
								Stops: body.Haltestellen.slice(0, parameter.limit),
								Meta: body.Metadata
							});
						}
					}else{
						body.Metadata.RequestTime = new Date().getTime() - Time_Started
						body.Metadata.URL = url
						resolve({
							Stops: body.Haltestellen,
							Meta: body.Metadata
						});
					}
				}else{
					if("body" in res){
						reject({code: res.statusCode, message: res.body.Message})
					}else{
						reject({code: res.statusCode})
					}
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
 * @param {String} url 
 * @param {String} latitude
 * @param {String} longitude
 * @param {Object} parameter 
 */
 let getStopsbygps = function(url, latitude, longitude, parameter) {
	return new Promise(function(resolve, reject) {
		let Time_Started = new Date().getTime();
		customHeaderRequest(url, { json: true }, (err, res, body) => {
			if (err) { reject(err); }
			try {
				if(res.statusCode === 200){
					body.Haltestellen.map((Haltestellen) => {
						Haltestellen.Distance = geolib.getDistance(
							{ latitude: latitude, longitude: longitude },
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
							body.Metadata.RequestTime = new Date().getTime() - Time_Started
							body.Metadata.URL = url
							resolve({
								Stops: body.Haltestellen.slice(0, parameter.limit),
								Meta: body.Metadata
							});
						}
					}else{
						body.Metadata.RequestTime = new Date().getTime() - Time_Started
						body.Metadata.URL = url
						resolve({
							Stops: body.Haltestellen,
							Meta: body.Metadata
						});
					}
				}else{
					if("body" in res){
						reject({code: res.statusCode, message: res.body.Message})
					}else{
						reject({code: res.statusCode})
					}
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

module.exports = {
	getStops,
    getStopsbygps
};