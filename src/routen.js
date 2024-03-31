const { customFetch } = require("../data/newRequest");

const getLocations = (url) => {
    return new Promise(function (resolve, reject) {
        let Time_Started = new Date().getTime();
        customFetch(url, { json: true }, (err, res, body) => {
            if (err) { reject(err); }
            body.Meta = {}
            body.Meta.RequestTime = new Date().getTime() - Time_Started
            body.Meta.URL = url
            resolve(body)
        })
    })
}

module.exports = {
    getLocations: getLocations
}