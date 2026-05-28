const fs = require("fs");
const path = require("path");
const path_static = path.join(__dirname, "../static");

const downloadlink = "https://www.nahverkehr-franken.de/bus/fuhrpark/pvu.html";

(async () => {
    const body = await fetch(downloadlink)
    const page = await body.text();

    const body_lines_array = page.split("\n");
    const table_start = body_lines_array.findIndex(line => line.includes("<table"));
    const list_object = {};
    let name, busid = ""; // They need to be persistant for the next loop because the names are not always in the same line

    for (let i = table_start; i < body_lines_array.length; i++) {
        if (body_lines_array[i].startsWith("<A")) { // All lines that start with <A contian operator names
            const line_array = body_lines_array[i].split('"'); // Split the line into an array to parse out the Operator name
            let previus_line = 0; // Stores where the alt= was at the end so the next string is garanteed to contain the Operator name
            let found_name = false;
            for (let j = 0; j < line_array.length; j++) {
                if (line_array[j].endsWith("name=")) {
                    found_name = true; // Set true so we don´t overwrite it with alt= later
                    previus_line = j;
                }
            }
            if (!found_name) { // If there was no name in the line, we try again with alt
                for (let j = 0; j < line_array.length; j++) {
                    if (line_array[j].endsWith("alt=")) {
                        previus_line = j;
                    }
                }
            }
            name = line_array[previus_line + 1];
        }

        if (body_lines_array[i].startsWith("<TR")) { // All lines that start with <TR contain the actual data
            const line_array = body_lines_array[i + 1].split('>'); // Split the line into an array to parse out the Vehicle id
            busid = line_array[1].split('<')[0];
        }

        if (!isNaN(parseInt(busid, 10))) {
            list_object[busid] = name;
        }

    }

    fs.writeFile(`${path_static}/PVU.json`, JSON.stringify(list_object), err => {
        if (err) {
            console.error(err);
            return false;
        }
        return true;
    })
})()