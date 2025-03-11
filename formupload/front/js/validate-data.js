var maddogbbox = { xmin: 401659, xmax: 401659, ymin: 6886993, ymax: 6886993 };

function loadbbox() {

    console.log('loadbbox');
    // TODO change for final url
    const bboxUrl = '/maddog/formupload/data/limites.geojson';

    fetch(bboxUrl)
        .then((response) => response.json())
        .then((json) => {
            json.features.forEach(feature => {
                feature.geometry.coordinates[0].forEach(coord => {
                    const [x, y] = coord;
                    if (x < maddogbbox.xmin) maddogbbox.xmin = x;
                    if (x > maddogbbox.xmax) maddogbbox.xmax = x;
                    if (y < maddogbbox.ymin) maddogbbox.ymin = y;
                    if (y > maddogbbox.ymax) maddogbbox.ymax = y;
                });
            });
        })
        .catch((error) => console.error(error));
}

function validateCSV(content, measureType) {

    const lines = content.trim().split('\n');
    const headers = lines[0].replace(/\r/g, '').split(';');

    console.log(headers);
    // Vérification des noms des entêtes
    const expectedHeaders = ['id', 'x', 'y', 'z', 'identifiant', 'date'];
    if (!arraysEqual(headers, expectedHeaders)) {
        return { valid: false, error: 'En-têtes incorrects ou dans le mauvais ordre.' };
    }

    // Vérification de l'ordre des id (ordre croissant)
    // Vérification du type de séparateur décimal pour les coordonnées (.)
    // Vérification du type de séparateur de champs (;)
    // Vérification des identifiants
    // Vérification du format de date (aaaa-mm-jj)
    const identifiants = [];
    let previousId = -1;
    let previousDate = null;

    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].replace(/\r/g, '').split(';');

        if (columns.length !== expectedHeaders.length) {
            return { valid: false, error: `Nombre incorrect de colonnes à la ligne ${i + 1}.` };
        }

        const id = parseInt(columns[0], 10);
        if (isNaN(id) || id <= previousId) {
            return { valid: false, error: `ID invalide ou non croissant à la ligne ${i + 1}.` };
        }
        previousId = id;

        console.log(maddogbbox);
        const x = parseFloat(columns[1]);
        const y = parseFloat(columns[2]);
        const z = columns[3].trim();
        if (isNaN(x) || isNaN(y) || (z !== '' && !isValidDecimal(z))) {
            return { valid: false, error: `Coordonnées invalides à la ligne ${i + 1}.` };
        }

        if (x > maddogbbox.xmax || x < maddogbbox.xmin || y > maddogbbox.ymax || y < maddogbbox.ymin) {
            return { valid: false, error: `Coordonnées en dehors de l'étendu possible ou mauvaise projection à la ligne ${i + 1}.` };
        }

        const identifiant = columns[4];
        if (!isValidIdentifiant(identifiant)) {
            return { valid: false, error: `Identifiant invalide à la ligne ${i + 1}.` };
        }
        identifiants.push(identifiant);

        const date = columns[5];
        // on vérifie les dates uniquement si ce n'est pas une mesure de type ref
        if (!isValidDate(date) && measureType != "REF") {
            return { valid: false, error: `Format de date invalide à la ligne ${i + 1}.` };
        }
        // Problèment pas nécessaire
        if (previousDate && date !== previousDate) {
            return { valid: false, error: `Date différente à la ligne ${i + 1}.` };
        }
        previousDate = date;
    }
    if (!identifiants.includes(measureType + "1")) {
        return { valid: false, error: `Le csv doit contenir au moins un identifiant de la forme ${measureType}1` };
    }

    return { valid: true, error: null };
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function isValidIdentifiant(identifiant) {
    const prfMatch = identifiant.match(/^PRF\d+$/);
    const tdcMatch = identifiant.match(/^TDC\d+$/);
    const startWithL = identifiant.match(/^l\d+$/);
    const startWithpc = identifiant.match(/^pc\d+$/);
    return prfMatch || tdcMatch || startWithL || startWithpc;
}

function isValidDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
}

function isValidDecimal(value) {
    const decimalRegex = /^-?\d+(\.\d+)?$/;
    return decimalRegex.test(value);
}



