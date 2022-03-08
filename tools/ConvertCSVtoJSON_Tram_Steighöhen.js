const request = require("request");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const path_static = path.join(__dirname, "../static");
let ErsteZeileArr = [];

const Filenames = {
    "1": "Steighoehen_Tram.json"
};

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
}

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

        const ErsteZeileArrTemp = body_lines_array[0].split(',');
        for (i = 0; i < ErsteZeileArrTemp.length; i++) {
            if (ErsteZeileArrTemp[i].includes('"position')) {
                ErsteZeileArrTemp[i] = ErsteZeileArrTemp[i].replace(/"/g, '');
                ErsteZeileArr.push(`${ErsteZeileArrTemp[i]}.5`);
            } else if (!ErsteZeileArrTemp[i].includes('5"')) {
                ErsteZeileArr.push(`${ErsteZeileArrTemp[i]}`);
            }
        }

        for (i = 1; i < body_lines_array.length - 1; i++) {

            const one_line = body_lines_array[i].split(",");
            let Stuff = {};

            for (j = 2; j < one_line.length; j++) {
                Stuff[ErsteZeileArr[j].replace("\r", "")] = one_line[j];
            };

            json_output[one_line["6"]] = Stuff;
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
        const dowhat = await askQuestion("Welche Datei möchtest du verarbeiten?\n1: Tram Steighöhen\n> ");
        const downloadlink = await askQuestion("Nenne mir den aktuellen Downloadlink\n> ");

        //const dowhat = 1;
        //const downloadlink = "https://opendata.vag.de/datastore/dump/37516980-a1ce-461f-aa68-bf466a70e7fc?bom=True";

        ParseCSV(dowhat, downloadlink);

    } catch (e) {
        console.log(e);
    }
})();

module.exports = {
    ParseCSV
}