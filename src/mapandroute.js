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

const geoLines = (url, line, isFeatureCollection = false) => {
    return new Promise(function(resolve, reject) {
        let Time_Started = new Date().getTime();
        customFetch(url, { json: true, gzip: true}, (err, res, body) => {
            if (err) { reject(err); return; }
            try {
                if (res.statusCode === 200) {
                    // The bus endpoint currently omits its JSON content type,
                    // so customFetch may return the response body as text.
                    if (typeof body === "string") body = JSON.parse(body);

                    let coordinates;
                    if (isFeatureCollection) {
                        const feature = body.features.find(feature => String(feature.properties?.name) === line);
                        if (!feature) {
                            reject({ code: 404, message: "Line not found", url: url });
                            return;
                        }
                        coordinates = feature.geometry.coordinates;
                    } else {
                        coordinates = body[line].geojson.geometry.coordinates;
                    }

                    let Metadata = {
                        RequestTime: new Date().getTime() - Time_Started,
                        url: url
                    };

                    resolve({
                        Cords: coordinates,
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
