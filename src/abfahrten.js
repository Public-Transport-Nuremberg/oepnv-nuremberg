const request = require("request");
const geolib = require("geolib");
const os = require('os');
const package = require('../package.json');

const customHeaderRequest = request.defaults({
    headers: {'User-Agent': `OpenVGN/${package.version} (NodeJS_${process.env.NODE_VERSION}) ${os.platform()} (${os.arch()}) NodeJS Wrapper`}
})

/**
 * @param {String} url 
 */
let getDepartures = function(url) {
	return new Promise(function(resolve, reject) {
		let Time_Started = new Date().getTime();
		customHeaderRequest(url, { json: true }, (err, res, body) => {
			if (err) { reject(err); }
			try {
				if(res.statusCode === 200){
					body.Abfahrten.map((Abfahrten) =>{
						Abfahrten.Produkt = Abfahrten.Produkt.replace(/ubahn/i,"U-Bahn",);
						const AbfahrtszeitIst = new Date(Abfahrten.AbfahrtszeitIst)
						const AbfahrtszeitSoll = new Date(Abfahrten.AbfahrtszeitSoll);
						
						Abfahrten.AbfahrtDate = AbfahrtszeitSoll.toLocaleDateString('de-DE')
						Abfahrten.AbfahrtTime = AbfahrtszeitSoll.toLocaleTimeString('de-DE', {hour: "2-digit", minute: "2-digit"})
						Abfahrten.Verspätung = (AbfahrtszeitIst - AbfahrtszeitSoll)/1000
					});

					body.Metadata.RequestTime = new Date().getTime() - Time_Started
					body.Metadata.URL = url
					if(!body.hasOwnProperty("Sonderinformationen")){
						body.Sonderinformationen = []
					}
					
					resolve({
						Stop: body.Haltestellenname,
						VAGID: body.VAGKennung,
						VGNID: body.VGNKennung,
						Departures: body.Abfahrten,
						Sonderinformationen: body.Sonderinformationen,
						Meta: body.Metadata
					});
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
let getDeparturesbygps = function(url, latitude, longitude, parameter, api_url, encodeQueryData) {
	return new Promise(function(resolve, reject) {
		let PromiseAbfahren = []
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
                        let url = `${api_url}/abfahrten.json/vgn/${Haltestellen.VGNKennung}`
                        if(parameter){
                            url = `${url}?${encodeQueryData(parameter)}`
                        }
						PromiseAbfahren.push(getDepartures(url))

					});

					Promise.all(PromiseAbfahren)
					.then(function(PAll) {
						for(i in PAll){
							body.Haltestellen[i].Abfahrten = PAll[i]
						}
						if(parameter.sort.toLowerCase() === "distance"){body.Haltestellen.sort((a, b) => (a.Distance > b.Distance) ? 1 : -1)};
						if(parameter.sort.toLowerCase() === "alphabetically"){body.Haltestellen.sort((a, b) => (a.Haltestellenname > b.Haltestellenname) ? 1 : -1)};
						if(parameter){
							if(parameter.limit){
								body.Metadata.RequestTime = new Date().getTime() - Time_Started
								body.Metadata.URL = url
								resolve({
									Stop: body.Haltestellenname,
									VAGID: body.VAGKennung,
									VGNID: body.VGNKennung,
									Stops: body.Haltestellen.slice(0, parameter.limit),
									Meta: body.Metadata
								});
							}
						}else{
							body.Metadata.RequestTime = new Date().getTime() - Time_Started
							body.Metadata.URL = url
							resolve({
								Stop: body.Haltestellenname,
								VAGID: body.VAGKennung,
								VGNID: body.VGNKennung,
								Stops: body.Haltestellen,
								Meta: body.Metadata
							});
						}
					}).catch(e => {
						console.log(e)
					})

				}else{
					if("body" in res){
						reject({code: res.statusCode, message: res.body.Message})
					}else{
						reject({code: res.statusCode})
					}
				}
			} catch (error) {
				if(error instanceof TypeError){
                    console.log(error)
					reject("Bad response from API");
				}
				reject(error);
			}
		});
	});

}

module.exports = {
	getDepartures,
    getDeparturesbygps
};