// Declare url for api and wps Maddog 
const url = "https://portail.indigeo.fr"

// Create config
const config = [{
    url: url + "/maddogapi/measure_type",
    idField: "id_measure_type",
    field: "type_measure",
    idSelect: "measureType"
},
{
    url: url + "/maddogapi/site",
    idField: "id_site",
    field: "code_site",
    textfield: "name_site",
    idSelect: "codeSite"
},
{
    url: url + "/maddogapi/operator",
    idField: "id_operator",
    field: "type_operator",
    idSelect: "idOperator"
},
{
    url: url + "/maddogapi/equipment",
    idField: "id_equipment",
    field: "name_equipment",
    idSelect: "idEquipement"
}
]

const siteDisplayToCode = new Map();

function resolveCodeSiteValue(rawValue) {
    return siteDisplayToCode.get(rawValue) || rawValue;
}

// Function to filter Json by value
function find_in_object(object, my_criteria) {
    return object.filter(function (obj) {
        return Object.keys(my_criteria).every(function (c) {
            return obj[c] == my_criteria[c];
        });
    });
};


// Function to add option in select
function optionsGenerator(value, text, select) {
    const elMainSelect = document.getElementById(select);
    if (!elMainSelect) return;
    if (elMainSelect.tagName === "SELECT") {
        const elOption = document.createElement('option');
        elOption.text = text;
        elOption.value = value;
        elMainSelect.appendChild(elOption);
        return;
    }
    if (elMainSelect.tagName === "INPUT") {
        const listId = elMainSelect.getAttribute('list');
        if (!listId) return;
        const datalist = document.getElementById(listId);
        if (!datalist) return;
        const elOption = document.createElement('option');
        elOption.value = value;
        if (text && text !== value) {
            elOption.label = text;
        }
        datalist.appendChild(elOption);
    }
};

// Function to add all options in select by API
function addOptionsSelect(url, field, textfield, idField, idSelect) {
    fetch(url)
        .then(function (response) {
            return response.json()
        })
        .then(function (json) {
            if (idSelect === "codeSite") {
                const inputEl = document.getElementById(idSelect);
                if (inputEl && inputEl.tagName === "INPUT") {
                    const listId = inputEl.getAttribute('list');
                    const datalist = listId ? document.getElementById(listId) : null;
                    if (datalist) {
                        datalist.innerHTML = "";
                    }
                    siteDisplayToCode.clear();
                }
            }
            if (idSelect === "codeSite") {
                json.sort((a, b) => {
                    const codeA = a[field] ? String(a[field]) : "";
                    const codeB = b[field] ? String(b[field]) : "";
                    return codeA.localeCompare(codeB);
                });
            }
            json.forEach(function (feature, index) {
                // If field as null display id field            
                let fieldSelect = feature[field] ? feature[field] : feature[idField];
                let fieldText = feature[textfield] ? feature[textfield] : fieldSelect;
                if (idSelect === "codeSite" && feature[field]) {
                    const codeSite = feature[field] ? feature[field] : feature[idField];
                    const siteName = feature[textfield] ? feature[textfield] : codeSite;
                    const display = `${siteName} (${codeSite})`;
                    siteDisplayToCode.set(display, codeSite);
                    fieldSelect = display;
                    fieldText = display;
                }
                // Create select's option for all feature
                optionsGenerator(fieldSelect, fieldText, idSelect)
            });
        });
};

// Add all options for config object
config.forEach(el => addOptionsSelect(el.url, el.field, el.textfield, el.idField, el.idSelect));

const codeSiteInput = document.getElementById('codeSite');
if (codeSiteInput && codeSiteInput.tagName === "INPUT") {
    codeSiteInput.addEventListener('change', (event) => {
        const resolved = resolveCodeSiteValue(event.target.value);
        event.target.dataset.code = resolved;
        revalidateCsvIfLoaded();
    });
}


// Management of the display of the select Profile
const selectMeasure = document.querySelector('#measureType');
const selectSite = document.querySelector('#codeSite');

async function handleSiteChange(event) {
    revalidateCsvIfLoaded();
    if (!selectMeasure || selectMeasure.value !== 'PRF') {
        return;
    }
    const target = event && event.target ? event.target : selectSite;
    if (!target) {
        return;
    }
    // Display PRF select
    document.getElementById('selectProfilId').style.display = "block";
    // Remove options from select
    document.getElementById('numProfil').innerHTML = "";
    document.getElementById('numProfil').required = true;

    // Get ID site with code site
    var codeSite = resolveCodeSiteValue(target.value);
    target.dataset.code = codeSite;
    if (!codeSite) {
        return;
    }
    let responseSite = await fetch(url + "/maddogapi/site");
    let jsonSite = await responseSite.json();
    // Filter site by code site
    var filtered_jsonSite = find_in_object(JSON.parse(JSON.stringify(jsonSite)), { code_site: codeSite });
    var idSite = filtered_jsonSite[0].id_site;
    // Get Profils for selected site
    let responsePRF = await fetch(url + "/maddogapi/sitemeasureprofil");
    let jsonPRF = await responsePRF.json();
    // Filter profiles by site id
    var filtered_jsonPRF = find_in_object(JSON.parse(JSON.stringify(jsonPRF)), { id_site: idSite });
    // Filter profiles by the type of measurement
    var PRF = find_in_object(filtered_jsonPRF, { measuretype: 'PRF' });
    // Sort profiles on num_profil
    PRF.sort((a, b) => a.num_profil - b.num_profil);
    // Display option if not profil
    if (!$.isArray(PRF) || !PRF.length) {
        optionsGenerator('', "Aucun profil n'est disponible pour le site sélectionné", 'numProfil');
    } else {
        PRF.forEach(el => optionsGenerator(el.num_profil, "Profil " + el.num_profil, 'numProfil'));
    }
}

if (selectSite) {
    selectSite.addEventListener('change', handleSiteChange);
}

selectMeasure.addEventListener('change', (event) => {
    var value = event.target.value;
    revalidateCsvIfLoaded();
    // IF PRF display numProfil information
    if (value == 'PRF') {
        document.getElementById('selectProfilId').style.display = "block";
        document.getElementById('numProfil').required = true;
        document.getElementById('numProfil').innerHTML = "";
        if (selectSite && selectSite.value) {
            handleSiteChange({ target: selectSite });
        }
    } else {
        document.getElementById('numProfil').required = false;
        document.getElementById('selectProfilId').style.display = "none";
    }
});

const numProfilSelect = document.getElementById('numProfil');
if (numProfilSelect) {
    numProfilSelect.addEventListener('change', () => {
        revalidateCsvIfLoaded();
    });
}

const epsgSelect = document.getElementById('epsg');
if (epsgSelect) {
    epsgSelect.addEventListener('change', () => {
        revalidateCsvIfLoaded();
    });
}

const surveyDateInput = document.getElementById('surveyDate');
if (surveyDateInput) {
    surveyDateInput.addEventListener('change', () => {
        revalidateCsvIfLoaded();
    });
}

// Reset form
function resetForm() {
    document.getElementById("formSuivi").reset();
    document.getElementById("formSuivi").classList.remove('was-validated');
    document.getElementById('numProfil').innerHTML = "";
    document.getElementById('numProfil').required = false;
    document.getElementById('selectProfilId').style.display = "none";
    const codeSiteInput = document.querySelector('#codeSite');
    if (codeSiteInput && codeSiteInput.dataset) {
        codeSiteInput.dataset.code = "";
    }
    csvContentLoaded = false;
    csvValidationError = null;
}

// Set csvContent parm if input is valid
function validationFormat() {
    var csvFile = document.getElementById('csvFile');

    // check extension
    var valeur = csvFile.value;
    var extensions = /(\.csv)$/i;
    if (!extensions.exec(valeur)) {
        csvFile.setCustomValidity("Format de fichier non valide, veuillez sélectionner un fichier .csv");
        csvFile.reportValidity();
        csvFile.value = '';
    } else {
        // Read csv file to string
        var files = csvFile.files;
        if (files.length === 0) {
            csvFile.setCustomValidity("Le fichier ne doit pas être vide");
            csvFile.reportValidity();
        } else {
            var reader = new FileReader();
            reader.onload = function (event) {
                // global variable
                csvContent = event.target.result;
                const result = validateCSV(csvContent, selectMeasure.value);
                csvContentLoaded = true;
                applyCsvValidationResult(result);
            };
            reader.readAsText(files[0]);
        }
    }
}

let csvContentLoaded = false;
let csvValidationError = null;

function applyCsvValidationResult(result) {
    var csvFile = document.getElementById('csvFile');
    if (!csvFile) return;
    if (!result.valid) {
        csvValidationError = result.error;
        csvFile.setCustomValidity(result.error);
        csvFile.reportValidity();
        document.getElementById('maddogImpBut').disabled = true;
        return;
    }
    csvValidationError = null;
    csvFile.setCustomValidity("");
    document.getElementById('maddogImpBut').disabled = false;
}

function revalidateCsvIfLoaded() {
    if (!csvContentLoaded) return;
    const result = validateCSV(csvContent, selectMeasure.value);
    applyCsvValidationResult(result);
}

// Disabling form submissions if there are invalid fields
(() => {
    'use strict'
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const formSuivi = document.getElementById("formSuivi");

    formSuivi.addEventListener('submit', event => {

        event.preventDefault();
        if (!formSuivi.checkValidity()) {
            event.stopPropagation();
        } else {
            importDataWPS()
        }
        formSuivi.classList.add('was-validated')
    }, false)

})()
