const request = require("request");

const { Steighoehen_Tram, StopInfo_Tram, StopInfo_Ubahn } = require("../static");

const VAGDE = "https://start.vag.de/dm/api";
const url = VAGDE + "/haltestellen.json/vag?name=";


(async function () {
    try {

        request(url, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }

            body.Haltestellen.map((Haltestelle) => {
                let HaltestellennameSplit = Haltestelle.Haltestellenname.split("(");
                Haltestelle.Haltestellenname = HaltestellennameSplit[0].trim();
                Haltestelle.Ort = HaltestellennameSplit[1].replace(/[)]/g, "",);
                Haltestelle.Produkte = Haltestelle.Produkte.replace(/ubahn/i, "U-Bahn",);
                Haltestelle.HaltestellenDaten = {}

                if (Haltestelle.Produkte.includes("Tram")) {
                    Haltestelle.HaltestellenDaten = { ...StopInfo_Tram[Haltestelle.Haltestellenname], ...Steighoehen_Tram[Haltestelle.Haltestellenname] }
                }

                if (Haltestelle.Produkte.includes("U-Bahn")) {
                    if (Haltestelle.Ort === "Fürth") {
                        if(StopInfo_Ubahn[`${Haltestelle.Ort}, ${Haltestelle.Haltestellenname}`] === undefined) {
                            console.log(`Missing from U-Bahn Stoplist: ${Haltestelle.Ort}, ${Haltestelle.Haltestellenname}`);
                        }
                    } else {
                        if(StopInfo_Ubahn[Haltestelle.Haltestellenname] === undefined) {
                            console.log(`Missing from U-Bahn Stoplist: ${Haltestelle.Haltestellenname}`);
                        }
                    }
                }
            });

            body.Haltestellen.map((Haltestelle) => {

                
                if (Haltestelle.Produkte.includes("Tram")) {
                    if (StopInfo_Tram[Haltestelle.Haltestellenname] === undefined) {
                        console.log(`${Haltestelle.Haltestellenname} is missing frim StopInfo_Tram`)
                    }

                    if (Steighoehen_Tram[Haltestelle.Haltestellenname] === undefined) {
                        //console.log(`${Haltestelle.Haltestellenname} is missing frim Steighoehen_Tram`)
                    }
                }
                

            });


        });

    } catch (e) {
        console.log(e);
    }
})();