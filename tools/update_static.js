const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const enable_null_default = false;

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
    if (typeof value !== "string") return value;
    const lower = value.toLowerCase();
    if (["x", "ja", "yes", "true"].includes(lower)) return true;
    if (["nein", "no", "false"].includes(lower)) return false;
    return value;
}

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

/**
 * Get the latest package data from a key
 * @param {String} key 
 * @returns {Promise<Object>}
 */
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

    // Get modified date from last_modified or metadata_modified or fall back to created
    const modified = new Date(latestResource.last_modified || page.result.metadata_modified || page.result.metadata_created);

    return { fileBuffer: fileBuffer, license: page.result.license_id, name: page.result.name, maintainer: page.result.maintainer, maintainer_email: page.result.maintainer_email, created: page.result.metadata_created, modified: modified };
}

/**
 * Transform the sheet into an object by a key with automatic boolean conversion,
 * ensuring no __EMPTY columns are included. Missing fields become null.
 *
 * @param {Object} workbook  XLSX Workbook object
 * @param {String} columnKey The header name of the column to use as the key
 */
function transformSheetByKey(workbook, columnKey) {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    let data;
    if (enable_null_default) {
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
    } else {
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    }

    const headers = data[0] || [];
    const dataRows = data.slice(1);

    const colMap = {};
    headers.forEach((header, colIndex) => {
        if (header && typeof header === "string" && header.trim() !== "") {
            colMap[colIndex] = header.trim();
        }
    });

    const keyColIndex = headers.indexOf(columnKey);
    if (keyColIndex === -1) {
        throw new Error(`Column "${columnKey}" not found in sheet headers.`);
    }

    const result = {};

    dataRows.forEach((rowArr) => {
        const keyValue = rowArr[keyColIndex] ?? null;

        // Build an object with all other valid headers
        const rowObj = {};
        for (const [colIndexStr, header] of Object.entries(colMap)) {
            const colIndex = Number(colIndexStr);
            if (colIndex === keyColIndex) continue; // skip the key column
            let cellValue = rowArr[colIndex] ?? null;
            cellValue = parseBoolean(cellValue);
            rowObj[header] = cellValue;
        }

        result[keyValue] = rowObj;
    });

    return result;
}

function transformStationsSheet(workbook) {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    let rawData;
    if (enable_null_default) {
        rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
    } else {
        rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    }

    const headers = rawData[0] || [];
    const rows = rawData.slice(1);

    // Map column indexes to actual header names
    const colMap = {};
    headers.forEach((header, index) => {
        if (header && typeof header === "string" && header.trim() !== "") {
            colMap[index] = header.trim();
        }
    });

    const result = {};
    rows.forEach((row) => {
        const rowObj = {};
        for (const [colIndexStr, headerName] of Object.entries(colMap)) {
            rowObj[headerName] = parseBoolean(row[colIndexStr] ?? null);
        }

        const vgnKey = rowObj.VGNKennung;
        if (!vgnKey) {
            console.error("Missing VGNKennung", rowObj);
            return;
        }

        if (!result[vgnKey]) {
            result[vgnKey] = { VAGKennung: rowObj.VAGKennung, Platforms: {} };
        }

        const platformKey = rowObj.Haltepunkt;
        if (platformKey) {
            result[vgnKey].Platforms[platformKey] = {
                GlobalID: rowObj.GlobalID,
                Haltestellenname: rowObj.Haltestellenname,
                latitude: rowObj.latitude,
                longitude: rowObj.longitude,
                Betriebszweig: rowObj.Betriebszweig,
                Dataprovider: rowObj.Dataprovider
            };
        }
    });

    return result;
}

function transformElevatorSheet(workbook) {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    let rawData;
    if (enable_null_default) {
        rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
    } else {
        rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    }

    const headers = rawData[0] || [];
    const rows = rawData.slice(1);

    // Map column indexes to actual header names
    const colMap = {};
    headers.forEach((header, index) => {
        if (header && typeof header === "string" && header.trim() !== "") {
            colMap[index] = header.trim();
        }
    });

    const result = {};
    rows.forEach((row) => {
        const rowObj = {};
        for (const [colIndexStr, headerName] of Object.entries(colMap)) {
            rowObj[headerName] = parseBoolean(row[colIndexStr] ?? null);
        }

        const vgnKey = rowObj.efa_nr_bhf;
        if (!vgnKey) {
            console.error("Missing efa_nr_bhf", rowObj);
            return;
        }

        if (!result[vgnKey]) {
            result[vgnKey] = {};
        }

        const platformKey = rowObj.lage_aufzug;
        if (platformKey) {
            result[vgnKey][platformKey] = {
                aufzug_nr_SAP_code: rowObj.aufzug_nr_SAP_code,
                ort: rowObj.ort,
                "u-bahnhof_kurz": rowObj["u-bahnhof_kurz"],
                "u-bahnhof_lang": rowObj["u-bahnhof_lang"],
                standort_von: rowObj.standort_von,
                standort_nach_1: rowObj.standort_nach_1,
                standort_nach_2: rowObj.standort_nach_2,
                standort_nach_3: rowObj.standort_nach_3,
                lichte_breite_aufzugstuer_cm: rowObj.lichte_breite_aufzugstuer_cm,
                breite_kabine_cm: rowObj.breite_kabine_cm,
                tiefe_kabine_cm: rowObj.tiefe_kabine_cm,
                durchladerichtung: rowObj.durchladerichtung,
                koordinate_breite: rowObj.koordinate_breite,
                "koordinate-laenge": rowObj["koordinate-laenge"]
            };
        }
    });

    return result;
}


(async () => {
    const avaible_keys = await checkPackageList();
    let sources_file = {};

    for (const key of avaible_keys) {
        const data = await getLatestPackageData(key);

        // Load the data into a workbook
        const workbook = XLSX.read(data.fileBuffer, { type: "buffer" });
        let fileToWrite = {};

        switch (key) {
            case "geokoordinaten-taxi-warteplatze":
                fileToWrite = transformSheetByKey(workbook, "Name");
                break;
            case "steighoehen-tram":
                fileToWrite = transformSheetByKey(workbook, "Haltestelle");
                break;
            case "fahrzeugtypen-tram":
                fileToWrite = transformSheetByKey(workbook, "fahrzeugnummer");
                break;
            case "u-bahn-aufzuege":
                fileToWrite = transformElevatorSheet(workbook, "efa_nr_bhf");
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
            case "haltestellen-id-geodaten":
                fileToWrite = transformStationsSheet(workbook);
                break;
            default:
                console.error(`Key ${key} is not implemented`);
                break;
        }

        delete data.fileBuffer;
        sources_file[data.name] = data;

        // Remove all values that are null (Recursively)
        if (!enable_null_default) {
            const removeNull = (obj) => {
                for (const key in obj) {
                    if (obj[key] === null) {
                        delete obj[key];
                    } else if (typeof obj[key] === "object") {
                        removeNull(obj[key]);
                    }
                }
            }
            removeNull(fileToWrite);
        }

        fs.writeFile(`${path.join(__dirname, "../static")}/${key}.json`, JSON.stringify(fileToWrite), err => {
            if (err) {
                console.error(err);
                return false;
            }
            return true;
        });

        fs.writeFile(`${path.join(__dirname, "../static_humanreadable")}/${key}.json`, JSON.stringify(fileToWrite, null, 2), err => {
            if (err) {
                console.error(err);
                return false;
            }
            return true;
        });
    }

    fs.writeFile(`${path.join(__dirname, "../static")}/sources.json`, JSON.stringify(sources_file), err => {
        if (err) {
            console.error(err);
            return false;
        }
        return true;
    });

    fs.writeFile(`${path.join(__dirname, "../static_humanreadable")}/sources.json`, JSON.stringify(sources_file, null, 2), err => {
        if (err) {
            console.error(err);
            return false;
        }
        return true;
    });
})()