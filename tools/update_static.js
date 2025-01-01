const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const opendata_keys = [
    "geokoordinaten-taxi-warteplatze",
    "haltestellen-id-geodaten", // Alle Haltestellen VAG
    "steighoehen-tram", // Höhe des Bahnsteigs an Tram Haltestellen
    "fahrzeugtypen-tram", // Details zu den Trams
    "u-bahn-aufzuege", // Details zu den Aufzügen an U-Bahn Haltestellen
    "bahnhoefe-u-bahn", // Details zu den U-Bahn Haltestellen
    "haltestellen-tram", // Details zu den Tram Haltestellen
    "fuhrpark-bus-ausstattung" // Details zu den Bussen
];

const opendata_vag = "https://opendata.vag.de"
const package_list = `${opendata_vag}/api/3/action/package_list`;
const package_show = `${opendata_vag}/api/3/action/package_show?id=`;

/**
 * Convert certain string values to boolean, otherwise return original value.
 */
const parseBoolean = (value) => {
    if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (['x', 'ja', 'yes'].includes(lower)) return true;
        if (['nein', 'no'].includes(lower)) return false;
    }
    return value;
};

/**
 * Check if all keys are still in the package list
 * @returns {Promise<Array<String>>}
 */
const checkPackageList = async () => {
    const body = await fetch(package_list);
    const page = await body.json();

    // Check if all opendata_keys are in the package list and then return all keys that are in the list and log errors if they are not
    return opendata_keys.map(key => {
        if (page.result.includes(key)) {
            return key;
        } else {
            console.error(`Key ${key} is not in the package list`);
        }
    });
}

const getLatestPackageData = async (key) => {
    const body = await fetch(package_show + key);
    const page = await body.json();

    // Check if page.result.resources is a array and if it has a length of at least 1 and return error if it is not
    if (!Array.isArray(page.result.resources) || page.result.resources.length < 1) {
        throw new Error(`Key ${key} has no resources`);
    }

    // Get the latest resource by metadata_modified value
    const latestResource = page.result.resources.reduce((prev, current) => {
        return (new Date(prev.metadata_modified) > new Date(current.metadata_modified)) ? prev : current;
    });

    // Get the data from the latest resource (As a file) only download csv, xlsx, xls files (Case insensitive)
    if (!/(csv|xlsx|xls)$/i.test(latestResource.format)) {
        throw new Error(`Key ${key} has no valid file format, it is ${latestResource.format}`);
    }

    console.log(`Downloading ${latestResource.url}`);
    const body_file = await fetch(latestResource.url);
    const file_arrayBuffer = await body_file.arrayBuffer();
    const fileBuffer = Buffer.from(file_arrayBuffer);

    return fileBuffer;
}

/**
 * Transform the sheet into an object by a key with automatic boolean conversion
 * @param {Object} workbook 
 * @param {String} columnKey 
 * @returns 
 */
const transformSheetByKey = (workbook, columnKey) => {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    const result = {};
  rows.forEach((row) => {
    const keyValue = row[columnKey];
    const { [columnKey]: _, ...restOfRow } = row;

    // Convert boolean values (x => true, nein => false, etc.)
    const formattedRow = Object.fromEntries(
      Object.entries(restOfRow).map(([field, value]) => [field, parseBoolean(value)])
    );

    result[keyValue] = formattedRow;
  });

    return result;
}

(async () => {
    const avaible_keys = await checkPackageList();

    for (const key of avaible_keys) {
        const data = await getLatestPackageData(key);

        // Load the data into a workbook
        const workbook = XLSX.read(data, { type: "buffer" });
        let fileToWrite = {};

        switch (key) {
            case "steighoehen-tram":
                fileToWrite = transformSheetByKey(workbook, "Haltestelle");
                break;
            case "fahrzeugtypen-tram":
                fileToWrite = transformSheetByKey(workbook, "fahrzeugnummer");
                break;
            case "u-bahn-aufzuege":
                fileToWrite = transformSheetByKey(workbook, "efa_nr_bhf");
                break;
            case "bahnhoefe-u-bahn":
                fileToWrite = transformSheetByKey(workbook, "u-bahnhof_lang");
                break;
            case "haltestellen-tram":
                fileToWrite = transformSheetByKey(workbook, "haltestelle");
                break;
            case "fuhrpark-bus-ausstattung":
                fileToWrite = transformSheetByKey(workbook, "Betriebsnummern");
                break;
            default:
                console.error(`Key ${key} is not implemented`);
                break;
        }

        fs.writeFile(`${path.join(__dirname, "../static")}/${key}.json`, JSON.stringify(fileToWrite), err => {
            if (err) {
                console.error(err);
                return false;
            }
            return true;
        });

    }
})()