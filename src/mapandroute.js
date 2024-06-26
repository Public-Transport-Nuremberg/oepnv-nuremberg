const { customFetch, customFetch_mapandroute } = require("../data/newRequest");

const reverseGeocode = (url) => {
    return new Promise(function(resolve, reject) {
        let Time_Started = new Date().getTime();
        customFetch_mapandroute(url, { json: true, gzip: true}, (err, res, body) => {
            if (err) { reject(err); return; }
            try {
                if (res.ok) {
                    let Metadata = {
                        RequestTime: new Date().getTime() - Time_Started,
                        url: url
                    };

                    resolve({
                        Location: body,
                        Meta: Metadata
                    });
                } else {
                    reject({ code: res.status, url: url });
                }
            } catch (error) {
                if (error instanceof TypeError) {
                    reject({ code: 500, message: "TypeError", url: url });
                } else {
                    reject({ code: 500, message: "Unknown Error", url: url });
                }
            }
        });
    });
}

const geoLines = (url, line) => {
    return new Promise(function(resolve, reject) {
        let Time_Started = new Date().getTime();
        customFetch(url, { json: true, gzip: true}, (err, res, body) => {
            if (err) { reject(err); return; }
            try {
                if (res.statusCode === 200) {
                    let Metadata = {
                        RequestTime: new Date().getTime() - Time_Started,
                        url: url
                    };

                    resolve({
                        Cords: body[line].geojson.geometry.coordinates,
                        Meta: Metadata
                    });
                } else {
                    reject({ code: res.statusCode, url: url });
                }
            } catch (error) {
                if (error instanceof TypeError) {
                    reject({ code: 500, message: "TypeError", url: url });
                } else {
                    reject({ code: 500, message: "Unknown Error", url: url });
                }
            }
        });
    });
}

module.exports = {
    reverseGeocode,
    geoLines
}