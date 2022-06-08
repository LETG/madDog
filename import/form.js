const config = [{
        url: "https://gis.jdev.fr/maddogapi/measure_type",
        idField :"id_measure_type",
        field: "type_measure",
        idSelect: "selectSuivi"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/site",
        idField :"id_site",
        field: "name_site",
        idSelect: "selectSite"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/profil",
        idField :"",
        field: "",
        idSelect: "selectProfil"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/operator",
        idField :"id_operator",
        field: "type_operator",
        idSelect: "selectOper"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/equipment",
        idField :"id_equipment",
        field: "name_equipment",
        idSelect: "selectEquip"
    }
]

// Functions to add option in select
function optionsGenerator(value, text, select) {
    const elMainSelect = document.getElementById(select);
    const elOption = document.createElement('option');
    elOption.text = value || text;
    elOption.value = value;
    elMainSelect.appendChild(elOption);
};

function addOptionsSelect(url,field,idField,idSelect) {
    fetch(url)
        .then(function(response) {
            return response.json()
        })
        .then(function(json) {            
            json.forEach(function(feature){
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
