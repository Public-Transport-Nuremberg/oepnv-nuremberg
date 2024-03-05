const cheerio = require('cheerio');
const package = require('../package.json');
const os = require('os');
const request = require("request");

const customHeaderRequest = request.defaults({
    headers: { 'User-Agent': `OpenVGN/${package.version} (NodeJS_${process.env.NODE_VERSION}) ${os.platform()} (${os.arch()}) NodeJS Wrapper` }
})

function generateTimestamps(start, end) {

    if (start === "Now") {
        start = new Date().toLocaleDateString('de-DE')
    }

    if (end === "Later") {
        end = new Date().toLocaleDateString('de-DE')
    }

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Extract day and month for start and end dates
    const [startDay, startMonth] = start.split('.');
    const [endDay, endMonth] = end.split('.');

    // Assume the year for start and end dates is the current year
    let startYear = currentYear;
    let endYear = currentYear;

    // If the start month is after the end month, the end date is in the next year
    if (parseInt(startMonth) > parseInt(endMonth)) {
        endYear += 1;
    }

    // Create Date objects for start and end dates with the specified times
    const startDate = new Date(startYear, startMonth - 1, startDay, 4, 0);
    // For the end date, add 1 day to handle the requirement of ending at 01:00 the next day
    const endDate = new Date(endYear, endMonth - 1, endDay, 1, 0);
    endDate.setDate(endDate.getDate() + 1);

    // Convert dates to ISO string or any other format you prefer
    const startTimestamp = startDate.toISOString();
    const endTimestamp = endDate.toISOString();

    return { startTimestamp, endTimestamp };
}

/**
 * Function to scrape the VAG Webpage to return all ongoing delays, elevator outages and planned events as a object
 * @returns Object
 */
const getVagWebpageDisturbances = (test) => {
    return new Promise(function (resolve, reject) {
        let Time_Started = new Date().getTime();
        customHeaderRequest("https://www.vag.de/fahrplan/fahrplanaenderungen-stoerungen", { json: false }, (err, res, body) => {
            if (err) { reject(err); }

            if (test) { body = test };

            let Time_Started_parse = new Date().getTime();
            const $ = cheerio.load(body);
            let schedule_changes = {};
            let disturbance_list = {};
            let disturbance = {};
            let Key = "";
            $('div[class=linieninfo_list]').children().each(function (i, e) {

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
                    //continue not possible...
                } else {
                    disturbance[Key].push($(this).text())
                }
            });

            let tracker = ""; //Used to convert headlines to object keys
            // Parse Aktuelle Störungen
            if (disturbance.hasOwnProperty("S")) {
                disturbance["S"].map((Key, i) => {
                    Key = Key.replace(/\r?\n|\r/g, "") //Replace new lines
                    Key = Key.replace(/\s\s\s+/g, '   ').split('   ') //Parsing spaces

                    if (!(i & 1)) {
                        tracker = Key[0].trim().split(" ")[0];
                        disturbance_list[tracker] = [];
                    } else {
                        for (let i = 1; i < Key.length; i = i + 3) {
                            if (Key[i] === "") { continue; }

                            const UpdatedString = `${Key[i + 2].split(":")[1]}:${Key[i + 2].split(":")[2]}`
                            const UpdatedStringDate = UpdatedString.split("um")[0].trim().split(".")
                            const UpdatedStringTIme = UpdatedString.split("um")[1]
                            const UpdatedStamp = new Date(`${[UpdatedStringDate[2], UpdatedStringDate[1], UpdatedStringDate[0]].join("-")} ${UpdatedStringTIme.replace("Uhr", "").trim()}`);

                            // Create Object if Aufzugsstörungen
                            if (tracker === "Aufzugsstörungen") {
                                disturbance_list[tracker].push({
                                    "Where": Key[i + 1],
                                    "Station": Key[i].split(",")[0],
                                    "What": Key[i].split(",")[1],
                                    "Updated": UpdatedStamp
                                })
                            }
                            // Create Object if U-Bahn
                            if (tracker === "U-Bahn" || tracker === "Bus" || tracker === "Tram") {
                                disturbance_list[tracker].push({
                                    "Until": (Key[i + 1] !== "beendet") ? Key[i + 1].replace("Uhr", "").trim().slice(8) : "beendet",
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
            if (disturbance.hasOwnProperty("F")) {
                disturbance["F"].map((Key, i) => {
                    Key = Key.replace(/\r?\n|\r/g, "") //Replace new lines
                    Key = Key.replace(/\s\s\s+/g, '   ').split('   ') //Parsing spaces
                    if (!(i & 1)) {
                        tracker = Key[0].trim().split(" ")[0];
                        schedule_changes[tracker] = [];
                    } else {
                        for (let i = 1; i < Key.length; i = i + 3) {
                            if (Key[i] === "") { continue; }
                            if (Key[i].toLowerCase().startsWith("linie")) {
                                const UpdatedString = `${Key[i + 2].split(":")[1]}:${Key[i + 2].split(":")[2]}`
                                const UpdatedStringDate = UpdatedString.split("um")[0].trim()?.split(".")
                                const UpdatedStringTIme = UpdatedString.split("um")[1]
                                const UpdatedStamp = new Date(`${[UpdatedStringDate[2], UpdatedStringDate[1], UpdatedStringDate[0]].join("-")} ${UpdatedStringTIme.replace("Uhr", "").trim()}`);

                                let Start, End;
                                // Check for "ab dem DD.MM" template, will be false if thats used.
                                if (Key[i + 1].split(" ")[0] !== "ab") {
                                    Start = (Key[i + 1].split(" ")[1] != "auf") ? Key[i + 1].split(" ")[1] : "Now"
                                    End = (Key[i + 1].split(" ")[3] != null) ? Key[i + 1].split(" ")[3] : "Later"
                                } else {
                                    Start = (Key[i + 1].split(" ")[2] != "auf") ? Key[i + 1].split(" ")[2] : "Now"
                                    End = "Unknown"
                                }

                                const { startTimestamp, endTimestamp } = generateTimestamps(Start, End);

                                // Create Object
                                schedule_changes[tracker].push({
                                    "Line": Key[i].split(":")[0].slice(6, Key[i].length),
                                    "What": Key[i].split(":")[1],
                                    "Start": startTimestamp,
                                    "End": endTimestamp,
                                    "Updated": UpdatedStamp
                                })
                            }
                        }
                    }
                })
            }
            resolve({
                schedule_changes: schedule_changes, disturbances: disturbance_list, Meta: {
                    Timestamp: new Date,
                    RequestTime: new Date().getTime() - Time_Started,
                    ParseTime: new Date().getTime() - Time_Started_parse,
                    URL: 'https://www.vag.de/fahrplan/fahrplanaenderungen-stoerungen'
                }
            })
        });
    });
};

module.exports = {
    getVagWebpageDisturbances
};