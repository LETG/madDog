// Create variable to content csv
var csvContent = null;

// Function to get select's value
function getValSelect(selectId){
    var value = document.getElementById(selectId).value;
    return value;
}


// Function to import Maddog Data with wps
function importDataWPS() {
    ExecuteResponse_v1_xml = ExecuteResponse_v1_xml.extend({
        instantiate: (wpsResponse) => {
            return wpsResponse
        }
    });
    // create WPS service from wps-js
    const wpsService = new WpsService({
        "url": url + "/geoserver/ows",
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
    wpsService.execute(
        (response) => {  
            var xmlResponse = response.responseDocument;
            var wpsStatus = xmlResponse.documentElement.getElementsByTagName("wps:Status")[0].childNodes[0].tagName;
            console.log(wpsStatus);
            // Process failed 
            if (wpsStatus == "wps:ProcessFailed"){
                document.getElementById('liveAlertPlaceholder').innerHTML="";
                alert("<b>Erreur de téléchargement</b></br>Veuillez vérifier votre saisie et votre fichier .csv (non nul)", 'danger');
            }
            // Process succeded
            else{
                var xmlResult = xmlResponse.documentElement.getElementsByTagName("wps:LiteralData");
                var wpsSuccesResponse = xmlResult[0].innerHTML;
                console.log(wpsSuccesResponse);
                // Succes true = download ok !
                if (wpsSuccesResponse == '{"succes":true}'){  
                    alert("Les données saisies ont été téléchargées avec succès !",'info');
                } 
                // Succes false = error !
                else {
                    //document.getElementById('liveAlertPlaceholder').innerHTML="";
                    alert("<b>Erreur de téléchargement</b></br>Veuillez retenter ultérieurement.Si le problème persiste, merci de nous contacter.", 'danger');
                }
            }            
    }, "imp:importData", "raw", "async", false, inputs, outputs);
}

// Function to validate form and display alert 
function validateForm(){ 
    if(document.getElementById("measureType").value == "") { 
        return false;
      }
      if(document.getElementById("codeSite").value == "") { 
          return false;
      }
      if(document.getElementById("surveyDate").value == "") { 
          return false;
      }
      if(document.getElementById("epsg").value == "") { 
          return false;
      }
      if(document.getElementById("idEquipement").value == "") { 
          return false;
      }
      if(document.getElementById("idOperator").value == "") { 
          return false;
      }
      if(document.getElementById("csvFile").value == "") { 
          return false;
      }
      else {
        importDataWPS();
        return true;      
      }
  }