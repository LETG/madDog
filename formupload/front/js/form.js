// Create config
const config = [{
    url: "https://gis.jdev.fr/maddogapi/measure_type",
    idField: "id_measure_type",
    field: "type_measure",
    idSelect: "measureType"
},
{
    url: "https://gis.jdev.fr/maddogapi/site",
    idField: "id_site",
    field: "name_site",
    idSelect: "codeSite"
},
{
    url: "https://gis.jdev.fr/maddogapi/profil",
    idField: "",
    field: "",
    idSelect: "numProfil"
},
{
    url: "https://gis.jdev.fr/maddogapi/operator",
    idField: "id_operator",
    field: "type_operator",
    idSelect: "idOperator"
},
{
    url: "https://gis.jdev.fr/maddogapi/equipment",
    idField: "id_equipment",
    field: "name_equipment",
    idSelect: "idEquipement"
}
]

// Intégration des options dans les selects via l'API Maddog 
// Functions to add option in select
function optionsGenerator(value, text, select) {
const elMainSelect = document.getElementById(select);
const elOption = document.createElement('option');
elOption.text = value || text;
elOption.value = value;
elMainSelect.appendChild(elOption);
};

function addOptionsSelect(url, field, idField, idSelect) {
fetch(url)
    .then(function(response) {
        return response.json()
    })
    .then(function(json) {
        json.forEach(function(feature, index) {
            // If field as null display id field
            if (feature[field] !== null && feature[field] !== "") {
                fieldSelect = feature[field];
            } else {
                fieldSelect = feature[idField];
            }
            // Create select's option for all feature
            optionsGenerator(fieldSelect, "", idSelect)
        });
    });
};

// Add all options for config object
config.forEach(el => addOptionsSelect(el.url, el.field, el.idField, el.idSelect));


// Gestion de l'affichage du select Profil
function showDivProfil(elem) {
if (elem.value == 'PRF') {
    document.getElementById('selectProfilId').style.display = "block";
} else {
    document.getElementById('selectProfilId').style.display = "none";
}
}


// Réinitialisation du formulaire 
function resetForm() {
document.getElementById("formSuivi").reset();
}

// Test du format du fichier uploader + Alerte
const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
const alert = (message, type) => {
const wrapper = document.createElement('div')
wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
].join('')

alertPlaceholder.append(wrapper)
}

function validationFormat() {
    var csvFile = document.getElementById('csvFile');
    var valeur = csvFile.value;
    var extensions = /(\.csv)$/i;
    if (!extensions.exec(valeur)) {
        alert('Format de fichier non valide, veuillez sélectionner un fichier .csv', 'danger');
        csvFile.value = '';
        return false;
    } else {
        // Read csv file to string
        var files = csvFile.files;
        if (files.length === 0) {
            console.log('No file is selected');
            return;
        }
        var reader = new FileReader();
        reader.onload = function(event) {
            csvContent = event.target.result;
        };
        reader.readAsText(files[0]);
    }
}

// Disabling form submissions if there are invalid fields
(() => {
'use strict'
// Fetch all the forms we want to apply custom Bootstrap validation styles to
const forms = document.querySelectorAll('.needs-validation')
// Loop over them and prevent submission
Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
        }
        form.classList.add('was-validated')
    }, false)
})
})()