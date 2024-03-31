const os = require('os');
const packageVersion = require('../package.json').version;
const { generateFakeUserAgent } = require("./fake_browser");

const custom_generateHeaders = () => {
    return {
        'User-Agent': `OpenVGN/${packageVersion} (NodeJS_${process.version}) ${os.platform()} (${os.arch()}) NodeJS Wrapper`
    };
}

const mapandroute_generateHeaders = () => {
    return {
        "Host": "iw.mapandroute.de",
        "User-Agent": generateFakeUserAgent(),
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
    };
}


const customFetch_mapandroute = async (url, options, callback) => {
    try {
        const headers = {...mapandroute_generateHeaders(), ...options.headers};
        
        const fetchOptions = {
            ...options,
            headers,
            ...(options.json ? { headers: { ...headers, 'Accept': 'application/json' } } : {}),
        };

        const response = await fetch(url, fetchOptions);
        let body = null;
        if (options.json) {
            body = await response.json();
        } else {
            body = await response.text();
        }
        callback(null, response, body);
    } catch (error) {
        callback(error, null, null);
    }
};

const customFetch = (url, options, callback) => {
    const headers = { ...custom_generateHeaders(), ...options.headers };

    const fetchOptions = {
        headers: headers,
        method: options.method || 'GET',
    };

    if (options.json) {
        fetchOptions.headers['Accept'] = 'application/json';
    }

    fetch(url, fetchOptions)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (options.json && contentType && contentType.includes('application/json')) {
                return response.json().then(body => ({ response, body }));
            }
            return response.text().then(body => ({ response, body }));
        })
        .then(({ response, body }) => {
            callback(null, { statusCode: response.status, headers: response.headers, body }, body);
        })
        .catch(error => callback(error, null, null));
}

module.exports = {
    customFetch,
    customFetch_mapandroute
}