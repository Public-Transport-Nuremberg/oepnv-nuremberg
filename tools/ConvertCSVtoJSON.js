const request = require('request');
const fs = require("fs");
const readline = require('readline');
const path = require('path');
const path_static = path.join(__dirname, '../static');
let ErsteZeileArr = "";

const Filenames = {
    "1": "Fuhrpark_Tram.json",
    "2": "Fuhrpark_Bus.json",
}

const Transportmittelnummer = {
    "1": "fahrzeugnummer",
    "2": "Betriebsnummer",
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
}

function GetCSVPosition(KeyString) {
    return ErsteZeileArr.indexOf(KeyString)
}

/**
 * 
 * @param {Number} dowhat 
 * @param {String} downloadlink 
 */
function ParseCSV(dowhat, downloadlink) {
    let json_output = {};

    request(downloadlink, { json: true }, (err, res, body) => {
        if (err) { throw err; }

        const body_lines_array = body.split("\n")

        ErsteZeileArr = body_lines_array[0].split(',');

        for (i = 1; i < body_lines_array.length-1; i++) {

            const one_line = body_lines_array[i].split(",");
            let Stuff = {};

            for (j = 2; j < one_line.length; j++) {
                Stuff[ErsteZeileArr[j].replace("\r", "")] = one_line[j];
            };

            json_output[one_line["1"]] = Stuff;
        }

        console.log(json_output);
    });
}



(async function () {
    try {
        const dowhat = await askQuestion("Welche Datei möchtest du verarbeiten?\n1: Tram Fuhrpark\n2: Bus Fuhrpark\n> ");
        const downloadlink = await askQuestion("Nenne mir den aktuellen Downloadlink\n> ");

        ParseCSV(dowhat, downloadlink);

    } catch (e) {
        console.log(e)
    }
})();