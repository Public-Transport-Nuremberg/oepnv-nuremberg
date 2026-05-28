const Fuhrpark_Bus = require("./fuhrpark-bus-ausstattung");
const Fuhrpark_Tram = require("./fahrzeugtypen-tram");
const Steighoehen_Tram = require("./steighoehen-tram");
const StopInfo_Tram = require("./haltestellen-tram");
const StopInfo_Ubahn = require("./bahnhoefe-u-bahn");
const Fuhrpark_PVU = require("./PVU");
const Tram_Types = require("./tram-types");


// Itterate over the keys of Fuhrpark_Tram and add the corresponding values from Tram_Types
for (const key in Fuhrpark_Tram) {
    if (Tram_Types[Fuhrpark_Tram[key].typ]) {
        Fuhrpark_Tram[key] = { ...Fuhrpark_Tram[key], ...Tram_Types[Fuhrpark_Tram[key].typ] };
    }
}

module.exports = {
    Fuhrpark_Bus,
    Fuhrpark_Tram,
    Fuhrpark_PVU,
    Steighoehen_Tram,
    StopInfo_Tram,
    StopInfo_Ubahn
}