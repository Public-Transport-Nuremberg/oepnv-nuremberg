const VAGDE = "https://start.vag.de/dm/api";
//https://start.vag.de/dm/api/haltestellen.json/vgn?name=Plärrer

const HPSSuggest = "https://www.vgn.de/ib/site/tools/HPSSuggest.php";
//https://www.vgn.de/ib/site/tools/HPSSuggest.php?query={QueryString}&gps=1&Edition=de

const VGNDE = "https://www.vgn.de/verbindungen/";
//https://www.vgn.de/verbindungen/?to=de%3A09564%3A704&td=coord%3A4440209.72739%3A686069.44855%3ANAV4%3AN%C3%BCrnberg%2C%20Leithastra%C3%9Fe

const request = require("request");

function urlReformat(value)
{
    value = value.replace(/ä/g, "%C3%A4");
    value = value.replace(/ö/g, "%C3%B6");
    value = value.replace(/ü/g, "%C3%BC");
    return value;
}

/* Haltestellen VAG API */
let getstops = function(Name) {
	return new Promise(function(resolve, reject) {
		var url = VAGDE + "/haltestellen.json/vgn?name=" + urlReformat(Name.trim());
		request(url, { json: true }, (err, res, body) => {
			if (err) { reject(err); }
			try {
				if(res.statusCode === 200){
					for(i in body.Haltestellen){
						let HaltestellennameSplit = body.Haltestellen[i].Haltestellenname.split("(");
						body.Haltestellen[i].Haltestellenname = HaltestellennameSplit[0].trim();
						body.Haltestellen[i].Ort = HaltestellennameSplit[1].replace(/[)]/g,"",);;
						body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/ubahn/i,"U-Bahn",);
						body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/,/g,", ",);
					}
				}else{
					reject(res.statusCode)
				}
				resolve(body.Haltestellen);
			} catch (error) {
				reject(error);
			}
  
		});
	});
}

module.exports = {
	getstops
};