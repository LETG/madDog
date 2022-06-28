
// Create variable to content csv
var csvContent = null;

// Function to get select's value
function getValSelect(selectId){
    var value = document.getElementById(selectId).value;
    return value;
}

// Function ton import Maddog Data with wps
function importDataWPS() {
    ExecuteResponse_v1_xml = ExecuteResponse_v1_xml.extend({
        instantiate: (wpsResponse) => {
            return wpsResponse
        }
    });
    // create WPS service from wps-js
    const wpsService = new WpsService({
        "url": "https://gis.jdev.fr/geoserver/ows",
        "version": "1.0.0"
    });
    let inputGenerator = new InputGenerator();
    // input
    const inputs = Object.values({
        measureType: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("measureType", null, null, getValSelect("measureType")),
        codeSite: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("codeSite", null, null, getValSelect("codeSite")),
        numProfil: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("numProfil", null, null, getValSelect("numProfil")),
        surveyDate: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("surveyDate", null, null, getValSelect("surveyDate")),
        epsg: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("epsg", null, null, getValSelect("epsg")),
        idEquipement: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("idEquipement", null, null, getValSelect("idEquipement")),
        idOperator: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("idOperator", null, null, getValSelect("idOperator")),
        csvContent: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("csvContent", null, null, csvContent)
    });
    // output
    const outputs = null;    
    wpsService.execute(() => {
        // do on return
    }, "imp:importData", "raw", "async", false, inputs, outputs);
}