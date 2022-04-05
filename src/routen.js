const request = require("request");
const os = require("os");
const package = require("../package.json");

const customHeaderRequest = request.defaults({
    headers: { "User-Agent": `OpenVGN/${package.version} (NodeJS_${process.env.NODE_VERSION}) ${os.platform()} (${os.arch()}) NodeJS Wrapper` }
})

const getLocations = (url) => {
    return new Promise(function (resolve, reject) {
        let Time_Started = new Date().getTime();
        customHeaderRequest(url, { json: true }, (err, res, body) => {
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