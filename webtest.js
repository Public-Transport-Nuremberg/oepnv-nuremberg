const cheerio = require('cheerio');
const fs = require('fs')
const util = require('util')
const package = require('./package.json');
const os = require('os');
const request = require("request");
//let Gdata = "";

const customFetch = request.defaults({
    headers: { 'User-Agent': `OpenVGN/${package.version} (NodeJS_${process.env.NODE_VERSION}) ${os.platform()} (${os.arch()}) NodeJS Wrapper` }
})

// Enable this to load a old webpage with all possible elements.
/*
fs.readFile('./test/VAGHtmlTestTemplates/AZandUbahn.txt', 'utf8', (err, data) => {
    if (err) { console.log(err) }
    Gdata = data
    askURL();
})
*/

const askURL = function () {
    return new Promise(function (resolve, reject) {
        let Time_Started = new Date().getTime();
        customFetch("https://www.vag.de/fahrplan/fahrplanaenderungen-stoerungen", { json: false }, (err, res, body) => {
            if (err) { reject(err); }

            //body = Gdata

            let Time_Started_parse = new Date().getTime();
            const $ = cheerio.load(body);
            let schedule_changes = {};
            let disturbance_list = {};
            let disturbance = {};
            let Key = "";
            $('div[class=linieninfo_list]').children().each(function (i, e) {
                if ($(this).find('stoer_list_content')) {
                    //console.log($(this).text())
                }
                //Aktuelle Störungen
                if ($(this).html().includes("Aktuelle Störungen")) {
                    disturbance["S"] = []
                    Key = "S"
                }

                //Aktuelle Fahrplanänderungen
                if ($(this).html().includes("Aktuelle Fahrplanänderungen")) {
                    disturbance["F"] = []
                    Key = "F"
                }

                //Skip Headlines
                if ($(this).text().includes("Aktuelle Störungen") || $(this).text().includes("Aktuelle Fahrplanänderungen")) {

                } else {
                    //console.log($(this).text())
                    disturbance[Key].push($(this).text())
                }
            });
            //out.interruption
            let tracker = "";
            // Parse Aktuelle Störungen
            if(disturbance.hasOwnProperty("S")){
                //console.log(disturbance)
                disturbance["S"].map((Key, i) => {
                    Key = Key.replace(/\r?\n|\r/g, "")
                    Key = Key.replace(/\s\s+/g, '  ').split("  ")

                    if (!(i & 1)) {
                        tracker = Key[0].trim().split(" ")[0];
                        disturbance_list[tracker] = [];
                    } else {
                        for (let i = 1; i < Key.length; i = i + 3) {
                            if (Key[i] === "") { continue; }

                            const UpdatedString = `${Key[i + 2].split(":")[1]}:${Key[i + 2].split(":")[2]}`
                            const UpdatedStringDate = UpdatedString.split("um")[0].trim().split(".")
                            const UpdatedStringTIme = UpdatedString.split("um")[1]
                            //console.log(Key[i])
                            const UpdatedStamp = new Date(`${[UpdatedStringDate[2], UpdatedStringDate[1], UpdatedStringDate[0]].join("-")} ${UpdatedStringTIme.replace("Uhr", "").trim()}`);

                            // Create Object if Aufzugsstörungen
                            if(tracker === "Aufzugsstörungen"){
                                disturbance_list[tracker].push({
                                    "Where": Key[i + 1],
                                    "Station": Key[i].split(",")[0],
                                    "What": Key[i].split(",")[1],
                                    "Updated": UpdatedStamp
                                })
                            }
                            // Create Object if U-Bahn
                            if(tracker === "U-Bahn" || tracker === "Bus" || tracker === "Tram"){
                                disturbance_list[tracker].push({
                                    "Until": Key[i + 1].replace("Uhr", "").trim().slice(8),
                                    "Line": Key[i].split(":")[0].slice(6, Key[i].length),
                                    "What": Key[i].split(":")[1],
                                    "Updated": UpdatedStamp
                                })
                            }
                        }
                    }
                })
            }
            // Parse Aktuelle Fahrplanänderungen
            if(disturbance.hasOwnProperty("F")){
                disturbance["F"].map((Key, i) => {
                    Key = Key.replace(/\r?\n|\r/g, "")
                    Key = Key.replace(/\s\s+/g, '  ').split("  ")
                    if (!(i & 1)) {
                        tracker = Key[0].trim().split(" ")[0];
                        schedule_changes[tracker] = [];
                    } else {
                        for (let i = 1; i < Key.length; i = i + 3) {
                            if (Key[i] === "") { continue; }
                            if (Key[i].toLowerCase().startsWith("linie")) {
                                const UpdatedString = `${Key[i + 2].split(":")[1]}:${Key[i + 2].split(":")[2]}`
                                const UpdatedStringDate = UpdatedString.split("um")[0].trim().split(".")
                                const UpdatedStringTIme = UpdatedString.split("um")[1]
                                const UpdatedStamp = new Date(`${[UpdatedStringDate[2], UpdatedStringDate[1], UpdatedStringDate[0]].join("-")} ${UpdatedStringTIme.replace("Uhr", "").trim()}`);
                                // Create Object
                                schedule_changes[tracker].push({
                                    "Line": Key[i].split(":")[0].slice(6, Key[i].length),
                                    "What": Key[i].split(":")[1],
                                    "Start": (Key[i + 1].split(" ")[1] != "auf") ? Key[i + 1].split(" ")[1] : "Now",
                                    "End": (Key[i + 1].split(" ")[3] != null) ? Key[i + 1].split(" ")[3] : "Later",
                                    "Updated": UpdatedStamp
                                })
                            }
                        }
                    }
                })
            }
            console.log(console.log(util.inspect({schedule_changes: schedule_changes, disturbances: disturbance_list}, false, null, true /* enable colors */)))
            /*console.log(JSON.stringify({schedule_changes: schedule_changes, disturbances: disturbance_list, Meta: {
                Timestamp: new Date,
                RequestTime: new Date().getTime() - Time_Started,
                ParseTime: new Date().getTime() - Time_Started_parse,
                URL: 'https://www.vag.de/fahrplan/fahrplanaenderungen-stoerungen'
            }}))*/
        });
    });
};

askURL();