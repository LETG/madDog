const config = [{
        url: "https://gis.jdev.fr/maddogapi/measure_type",
        field: "type_measure",
        id: "selectSuivi"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/site",
        field: "name_site",
        id: "selectSite"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/profil",
        field: "",
        id: "selectProfil"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/operator",
        field: "type_operator",
        id: "selectOper"
    },
    {
        url: "https://gis.jdev.fr/maddogapi/equipment",
        field: "name_equipment",
        id: "selectEquip"
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

function addOptionsSelect(url, field, idSelect) {
    fetch(url)
        .then(function(response) {
            return response.json()
        })
        .then(function(json) {
            json.forEach(feature => optionsGenerator(feature[field], "", idSelect));
        });
};

// Boucle sur l'ensemble des objets du config
config.forEach(el => addOptionsSelect(el.url, el.field, el.id));
