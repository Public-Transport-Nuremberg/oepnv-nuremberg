const request = require("request");
const geolib = require("geolib");

/**
 * @param {String} url 
 */
let getDepartures = function(url) {
	return new Promise(function(resolve, reject) {
		request(url, { json: true }, (err, res, body) => {
			if (err) { reject(err); }
			try {
				if(res.statusCode === 200){
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
												
						Abfahrten.AbfahrtZeitFormat = `${AbfahrtZeitSollArrayDatum.split("/").join(".")} ${AbfahrtZeitSollArray[1]}`
						Abfahrten.AbfahrtZeitZeit = AbfahrtZeitSollArray[1]
						Abfahrten.Verspätung = (AbfahrtZeitIstArrayZeitUnix - AbfahrtZeitSollArrayZeitUnix)/1000
					});
					resolve(body.Abfahrten);
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
 * @param {String} url 
 * @param {String} latitude
 * @param {String} longitude
 * @param {Object} parameter 
 */
let getDeparturesbygps = function(url, latitude, longitude, parameter, api_url, encodeQueryData) {
	return new Promise(function(resolve, reject) {
		let PromiseAbfahren = []
		request(url, { json: true }, (err, res, body) => {
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
								resolve(body.Haltestellen.slice(0, parameter.limit));
							}
						}else{
							resolve(body.Haltestellen);
						}
					});

				}else{
					reject(res.statusCode)
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