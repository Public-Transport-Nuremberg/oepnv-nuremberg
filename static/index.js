const Fuhrpark_Bus = require("./fuhrpark-bus-ausstattung");
const Fuhrpark_Tram = require("./fahrzeugtypen-tram");
const Steighoehen_Tram = require("./steighoehen-tram");
const StopInfo_Tram = require("./haltestellen-tram");
const StopInfo_Ubahn = require("./bahnhoefe-u-bahn");
const Fuhrpark_PVU = require("./PVU");

module.exports = {
    Fuhrpark_Bus,
    Fuhrpark_Tram,
    Fuhrpark_PVU,
    Steighoehen_Tram,
    StopInfo_Tram,
    StopInfo_Ubahn
}