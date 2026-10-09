const { customFetch } = require("../data/newRequest");

/**
 * @param {String} url
 */
const getElevatorInfo = (url) => {
	return new Promise(function (resolve, reject) {
		let Time_Started = new Date().getTime();
		customFetch(url, { json: true, headers: { "Accept-Language": "de" } }, (err, res, body) => {
			if (err) { reject(err); return; }
			try {
				if (res.statusCode !== 200) {
					reject({ code: res.statusCode, message: res.body?.Message || res.body?.message, url: url });
					return;
				}
				if (typeof body === "string") body = JSON.parse(body);
				if (!Array.isArray(body)) {
					reject(new Error("Bad response from API"));
					return;
				}
				resolve({
					Elevators: body,
					Meta: {
						RequestTime: new Date().getTime() - Time_Started,
						URL: url
					}
				});
			} catch (error) {
				reject(error);
			}
		});
	});
}

module.exports = {
	getElevatorInfo
};
