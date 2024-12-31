const cheerio = require('cheerio');
const { customFetch } = require("../data/newRequest");

// THIS FILE DOES DO A LOT OF ASSUMPIONS
// The VAG hates to write dates in a consistent format, so we have to make some assumptions
// The VAG wants people to guess the year, so we have to make some assumptions aswell

// Why do we even have to guess this???? Whats so hard about writing a date in a consistent format?????

function generateTimestamps(start, end) {
    // e.g. "16.07.24" => {day: 16, month: 7, year: 2024}
    // e.g. "04.08."   => {day: 4,  month: 8, year: CURRENT_YEAR}
    function parseDate(dateStr) {
        // Trim and remove trailing . if present
        dateStr = dateStr.trim();
        if (dateStr.endsWith(".")) {
            dateStr = dateStr.slice(0, -1);
        }

        const parts = dateStr.split(".");
        if (parts.length < 2) {
            throw new Error(`Invalid date format: "${dateStr}"`);
        }

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year;

        // Check if year is provided
        if (parts[2]) {
            const yearStr = parts[2].trim();
            // Assume 2-digit year means 20YY
            if (yearStr.length === 2) {
                year = 2000 + parseInt(yearStr, 10);
            } else {
                year = parseInt(yearStr, 10);
            }
        } else {
            // No year provided => assume current year (OR next year if month is in the past at later check)
            year = new Date().getFullYear();
        }

        return { day, month, year };
    }

    const startObj = parseDate(start);
    const endObj = parseDate(end);

    let startYear = startObj.year;
    let endYear = endObj.year;

    // If start and end have the same year but the start month is greater, bump the end year
    if (startYear === endYear && startObj.month > endObj.month) {
        endYear++;
    }

    // Construct the Date objects (start at 04:00, end at 01:00 *next* day)
    const startDate = new Date(startYear, startObj.month - 1, startObj.day, 4, 0);
    const endDate = new Date(endYear, endObj.month - 1, endObj.day, 1, 0);
    endDate.setDate(endDate.getDate() + 1); // shift 1 day ahead

    const startTimestamp = startDate.toISOString();
    const endTimestamp = endDate.toISOString();

    return [startTimestamp, endTimestamp];
}

/**
 * Function to scrape the VAG Webpage to return all ongoing delays, elevator outages and planned events as a object
 * @returns Object
 */
const getVagWebpageDisturbances = (test) => {
    return new Promise(function (resolve, reject) {
        let Time_Started = new Date().getTime();
        customFetch("https://www.vag.de/fahrplan/fahrplanaenderungen-stoerungen", { json: false }, (err, res, body) => {
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
                try {
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
                                    const splitted = Key[i + 1].split(" ");

                                    if (splitted[0] !== "ab") {
                                        Start = splitted[1] !== "auf" ? splitted[1] : "Now";
                                        End = splitted[3] || "Later";
                                        if (splitted[4]) End += splitted[4]; // Handle strange way VAG writes dates... eg "04.08. 25" => "04.08." + "25" => "04.08.25"
                                    } else {
                                        Start = splitted[2] !== "auf" ? splitted[2] : "Now";
                                        End = "Unknown";
                                    }

                                    let startTimestamp, endTimestamp;

                                    try {
                                        [startTimestamp, endTimestamp] = generateTimestamps(Start, End);
                                    } catch (e) {
                                        startTimestamp = new Date(1).toISOString();
                                        endTimestamp = new Date(1).toISOString();
                                    }

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
                } catch (e) {
                    console.log(e)
                }
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