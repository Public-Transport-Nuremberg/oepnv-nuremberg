const { customFetch } = require("../data/newRequest");

/**
 * @param {String} url 
 */
const getTrips = (url) => {
	return new Promise(function (resolve, reject) {
		let Time_Started = new Date().getTime();
		customFetch(url, { json: true }, (err, res, body) => {
			if (err) { reject(err); }
			try {
				if (res.statusCode !== 200) {
					if ("body" in res) {
						reject({ code: res.statusCode, message: res.body.Message, url: url || "" })
					} else {
						reject({ code: res.statusCode, url: url || "" })
					}
				}
				let Metadata = body.Metadata
				delete body.Metadata
				Metadata.RequestTime = new Date().getTime() - Time_Started
				Metadata.URL = url

				if (body.hasOwnProperty("Fahrten")) {
					body.Fahrten.map((Fahrt) => {
						const Startzeit = new Date(Fahrt.Startzeit);
						const Endzeit = new Date(Fahrt.Endzeit);

						Fahrt.StartzeitDate = Startzeit.toLocaleDateString('de-DE')
						Fahrt.StartzeitTime = Startzeit.toLocaleTimeString('de-DE', { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })
						Fahrt.ZeitlicheDauer = (Endzeit - Startzeit) / 1000
					});
				}

				if (body.hasOwnProperty("Fahrtverlauf")) {
					body.Fahrtverlauf.map((Fahrt) => {
						const AbfahrtszeitIst = new Date(Fahrt.AbfahrtszeitIst || Fahrt.AnkunftszeitIst);
						const AbfahrtszeitSoll = new Date(Fahrt.AbfahrtszeitSoll || Fahrt.AnkunftszeitSoll);

						Fahrt.AbfahrtDate = AbfahrtszeitSoll.toLocaleDateString('de-DE')
						Fahrt.AbfahrtTime = AbfahrtszeitSoll.toLocaleTimeString('de-DE', { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })
						Fahrt.Verspätung = (AbfahrtszeitIst - AbfahrtszeitSoll) / 1000
					});
				}

				resolve({
					Fahrt: body,
					Meta: Metadata
				});
			} catch (error) {
				if (error instanceof TypeError) {
					reject("Bad response from API" + error);
				}
				reject(error);
			}
		});
	});
}

module.exports = {
	getTrips
};