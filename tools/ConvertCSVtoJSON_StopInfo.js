const request = require("request");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const path_static = path.join(__dirname, "../static");
let ErsteZeileArr = [];

const Filenames = {
    "1": "StopInfo_Tram.json",
    "2": "StopInfo_Ubahn.json",
}

/* Functions */
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
};

/**
 * Downloads a file from the given URL, parses it and stores the result in static folder.
 * @param {Number} dowhat 
 * @param {String} downloadlink 
 */
function ParseCSV(dowhat, downloadlink) {
    let json_output = {};

    request(downloadlink, { json: true }, (err, res, body) => {
        if (err) { throw err; }

        const body_lines_array = body.split("\n");

        ErsteZeileArr = body_lines_array[0].split(',');

        for (i = 1; i < body_lines_array.length - 1; i++) {

            const one_line = body_lines_array[i].split(",");
            let Stuff = {};
            if (one_line["3"] === '"Fürth') {
                one_line["3"] = `Fürth, ${one_line["4"].trim().replace('"', "")}`;
                one_line.splice(4,1)
            }

            for (j = 2; j < one_line.length; j++) {
                if (ErsteZeileArr[j] == null) { continue; }
                if (one_line[j] === "x") {
                    Stuff[ErsteZeileArr[j].replace("\r", "")] = true;
                    continue;
                }

                if (one_line[j] === "\"\"") {
                    if (!Stuff[ErsteZeileArr[j]]) { Stuff[ErsteZeileArr[j].replace("\r", "")] = false; continue; }
                    Stuff[ErsteZeileArr[j].replace("\r", "")] = false;
                    continue;
                }

                Stuff[ErsteZeileArr[j].replace("\r", "")] = one_line[j];
            };

            json_output[one_line["3"]] = Stuff;
        }

        fs.writeFile(`${path_static}/${Filenames[dowhat]}`, JSON.stringify(json_output), err => {
            if (err) {
                console.error(err);
                return false;
            }
            return true;
        })
    });
}



(async function () {
    try {
        const dowhat = await askQuestion("Welche Datei möchtest du verarbeiten?\n1: Tram StopsInfo\n2: U-Bahn StopsInfo\n> ");
        const downloadlink = await askQuestion("Nenne mir den aktuellen Downloadlink\n> ");

        //const dowhat = 2
        //const downloadlink = "https://opendata.vag.de/datastore/dump/fb0a4c02-79c9-4985-a60a-8b7ff2f4a70d?bom=True" //Tram
        //const downloadlink = "https://opendata.vag.de/datastore/dump/0eb9116d-7ad5-4fc2-b9b5-5879b39697b2?bom=True" //U-Bahn

        ParseCSV(dowhat, downloadlink);

    } catch (e) {
        console.log(e);
    }
})();

module.exports = {
    ParseCSV
}