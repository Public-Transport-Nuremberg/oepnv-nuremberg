const request = require("request");
const fakeUA = require("../data/fake_browser");

const customHeaderRequest = request.defaults({
    headers: { 
        "Host": "iw.mapandroute.de",
        "User-Agent": fakeUA.generateFakeUserAgent(),
        "Accept": "*/*",
        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br",
        "Origin": "https://www.vgn.de",
        "Connection": "keep-alive",
        "Referer": "https://www.vgn.de/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "TE": "Trailers"
    }
});

const reverseGeocode = (url) => {
    return new Promise(function(resolve, reject) {
        let Time_Started = new Date().getTime();
        customHeaderRequest(url, { json: true, gzip: true}, (err, res, body) => {
            if (err) { reject(err); }
            try {
                if(res.statusCode === 200){
                    let Metadata = {
                        RequestTime: new Date().getTime() - Time_Started,
                        url: url
                    }

                    resolve({
                        Location: body,
                        Meta: Metadata
                    });
                }else{
                    if("body" in res){
                        reject({code: res.statusCode, url: url})
                    }else{
                        reject({code: res.statusCode, url: url})
                    }
                }
            } catch (error) {
                if(error instanceof TypeError){
                    reject({code: 500, message: "TypeError", url: url})
                }else{
                    reject({code: 500, message: "Unknown Error", url: url})
                }
            }
        });
    });
}

module.exports = {
    reverseGeocode
}