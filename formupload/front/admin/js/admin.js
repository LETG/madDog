// Configuration
const URL_BACKEND_ADMIN = "http://localhost";
const URL_BACKEND_API = URL_BACKEND_ADMIN+"/maddogapi";

const USER_SITES= URL_BACKEND_ADMIN + "/maddogimport/admin/data/site_user_list.json";
const SURVEYS_API= URL_BACKEND_API+"/survey";
const SITES_API= URL_BACKEND_API+"/site";
const MTYPE_API= URL_BACKEND_API+"/measure_type";
const PROFIL_API= URL_BACKEND_API+"/profil";
const HISTORY_API= URL_BACKEND_API+"/history";

///------------ TOOLS FUNCTIONS ------------///
// Commons function to manage fetch and error
async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch ${url} failed ${r.status}`);
  return r.json();
}

// Function to add option in select
function optionsGenerator(value, text, select) {
    const elMainSelect = document.getElementById(select);
    const elOption = document.createElement('option');
    elOption.text = text;
    elOption.value = value;
    elMainSelect.appendChild(elOption);
};

///------------ END TOOLS FUNCTIONS ------------///

// Récupération des sites pour un utilisateur donné
async function getSitesForUser(username) {
    const data = await fetchJson(USER_SITES);
    return data
        .filter(site =>
            (site.admin && site.admin.includes(username)) ||
            (site.user && site.user.includes(username))
        )
        .map(site => site.id_site);
}

// populate adminCodeSite select with user sites
async function populateSiteListForUser(username) {
    console.log("Populating site list for user:", username);
    const userSites = await getSitesForUser(username);
    const allSites = await fetchJson(SITES_API);
    const allMeasuresType = await fetchJson(MTYPE_API);

    // input + datalist elements (adminCodeSite = input, adminCodeSiteList = datalist)
    const inputEl = document.getElementById('adminCodeSite');
    const datalist = document.getElementById('adminCodeSiteList');
    if (!inputEl || !datalist) {
        console.warn('adminCodeSite input or adminCodeSiteList datalist not found in DOM');
        return;
    }

    // clear previous options / lookup
    datalist.innerHTML = '';
    inputEl.value = '';
    const siteLookup = new Map(); // display -> id_site

    // populate datalist with sites available to the user
    allSites
        .filter(site => userSites.includes(site.code_site))
        .forEach(site => {
            const display = `${site.name_site || site.code_site} (${site.code_site})`;
            const opt = document.createElement('option');
            opt.value = display;
            datalist.appendChild(opt);
            siteLookup.set(display, site.id_site);
        });

    // when user selects / changes value, load surveys for the corresponding id_site
    inputEl.addEventListener('change', async (event) => {
        const selectedDisplay = event.target.value;
        const selectedSiteId = siteLookup.get(selectedDisplay);
        if (!selectedSiteId) {
            console.warn('selected site not found for:', selectedDisplay);
            renderSurveysTable([]); // clear table
            return;
        }

        const surveys = await fetchJson(SURVEYS_API+"?id_site=eq."+selectedSiteId+"&select=id_site,id_survey,date_survey,id_measure_type_survey,profil(num_profil)&order=date_survey.asc,id_measure_type_survey.desc");
        surveys.forEach(survey => {
          // use allMeasuresType to map measure type details
          const measureType = allMeasuresType.find(mt => mt.id_measure_type === survey.id_measure_type_survey);
          // flatten profil and measure_type into single profil string
          survey.profil = measureType.type_measure + survey.profil[0].num_profil;
          delete survey.measure_type;
        });
        renderSurveysTable(surveys);
    });
}

/**
 * create and render a table of surveys in the specified container
 * @param {Array} surveys - array of survey objects
 * @param {string} containerId - id of the container to render the table into
 */
// ...existing code...
function renderSurveysTable(surveys, containerId = 'surveyTableContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!surveys || surveys.length === 0) {
    container.innerHTML = '<p>Aucun survey disponible pour cet utilisateur.</p>';
    return;
  }

  // columns to hide
  const hiddenCols = new Set(['id_measure_type_survey','id_site']);

  // Toolbar with action button
  const toolbar = document.createElement('div');
  toolbar.className = 'mb-2 d-flex align-items-center';
  const btnShow = document.createElement('button');
  btnShow.type = 'button';
  btnShow.className = 'btn btn-primary btn-sm me-2';
  btnShow.textContent = 'Supprimer la sélection';
  toolbar.appendChild(btnShow);

  const selectedCount = document.createElement('span');
  selectedCount.className = 'text-muted';
  selectedCount.textContent = ' 0 sélectionné(s)';
  toolbar.appendChild(selectedCount);

  container.appendChild(toolbar);

  // collect keys and filter hidden columns
  const keys = Array.from(surveys.reduce((set, s) => {
    Object.keys(s).forEach(k => set.add(k));
    return set;
  }, new Set())).filter(k => !hiddenCols.has(k));

  const table = document.createElement('table');
  table.className = 'table table-sm table-striped';

  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');

  // first column header: select all checkbox
  const thSelect = document.createElement('th');
  const chkAll = document.createElement('input');
  chkAll.type = 'checkbox';
  chkAll.title = 'Sélectionner tout';
  thSelect.appendChild(chkAll);
  hrow.appendChild(thSelect);

  keys.forEach(k => {
    const th = document.createElement('th');
    th.textContent = k;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  surveys.forEach((s, i) => {
    const row = document.createElement('tr');

    // checkbox cell
    const tdChk = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'select-row';
    chk.dataset.index = String(i);
    tdChk.appendChild(chk);
    row.appendChild(tdChk);

    // data cells (skip hidden columns)
    keys.forEach(k => {
      const td = document.createElement('td');
      const v = s[k];
      td.textContent = (v === null || v === undefined) ? '' :
                       (typeof v === 'object' ? JSON.stringify(v) : String(v));
      row.appendChild(td);
    });

    // row checkbox handler: toggle active class and update count/checkbox state
    chk.addEventListener('change', () => {
      if (chk.checked) row.classList.add('table-active'); else row.classList.remove('table-active');
      updateSelectedCount();
      updateHeaderCheckbox();
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  // helper functions
  function updateSelectedCount() {
    const count = container.querySelectorAll('input.select-row:checked').length;
    selectedCount.textContent = ` ${count} sélectionné(s)`;
  }
  function updateHeaderCheckbox() {
    const all = container.querySelectorAll('input.select-row').length;
    const checked = container.querySelectorAll('input.select-row:checked').length;
    if (checked === 0) {
      chkAll.checked = false;
      chkAll.indeterminate = false;
    } else if (checked === all) {
      chkAll.checked = true;
      chkAll.indeterminate = false;
    } else {
      chkAll.checked = false;
      chkAll.indeterminate = true;
    }
  }

  // header checkbox handler (select/deselect all)
  chkAll.addEventListener('change', () => {
    const rows = container.querySelectorAll('input.select-row');
    rows.forEach(r => {
      r.checked = chkAll.checked;
      const tr = r.closest('tr');
      if (r.checked) tr.classList.add('table-active'); else tr.classList.remove('table-active');
    });
    updateSelectedCount();
    chkAll.indeterminate = false;
  });

  // button click: collect selected items and show in alert
  btnShow.addEventListener('click', () => {
    const checked = Array.from(container.querySelectorAll('input.select-row:checked'));
    if (checked.length === 0) {
      window.alert('Aucune ligne sélectionnée.');
      return;
    }
    const selected = checked.map(c => {
      const idx = Number(c.dataset.index);
      return surveys[idx];
    });
    // set site for deletion
    logSiteSelection(selected).catch(err => {
      console.error('Error logging site selection:', err);
    });
  });

  // initialize counts/checkbox state
  updateSelectedCount();
  updateHeaderCheckbox();
}

// call postgrest API to store id_site in history table
async function logSiteSelection(surveysToDelete) {
  const MADDOG_USER = new URLSearchParams(window.location.search).get('user');
  const container = document.getElementById('surveyTableContainer');

  // create spinner overlay (inject CSS once)
  if (!document.getElementById('prf-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'prf-spinner-style';
    style.textContent = `
      .prf-spinner-overlay{
        position: absolute;
        inset: 0;
        display:flex;
        align-items:center;
        justify-content:center;
        background: rgba(255,255,255,0.6);
        z-index: 9999;
      }
      .prf-spinner {
        display:inline-block;
        width:48px;
        height:48px;
        border:5px solid rgba(0,0,0,0.1);
        border-top-color:#007bff;
        border-radius:50%;
        animation: prf-spin 0.8s linear infinite;
      }
      @keyframes prf-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  // ensure container is positioned to allow overlay absolute
  const containerParent = container || document.body;
  const prevPos = containerParent.style.position;
  if (getComputedStyle(containerParent).position === 'static') {
    containerParent.style.position = 'relative';
  }

  const overlay = document.createElement('div');
  overlay.className = 'prf-spinner-overlay';
  overlay.innerHTML = '<div class="prf-spinner" title="Traitement en cours..."></div>';
  containerParent.appendChild(overlay);

  try {
     // build payload: array of history records
    const payload = surveysToDelete.map(survey => ({
      id_survey: survey.id_survey,
      date_survey: survey.date_survey ? new Date(survey.date_survey).toISOString() : null,
      id_site: survey.id_site,
      id_measure_type: survey.id_measure_type_survey,
      username: MADDOG_USER,
      date_requested: new Date().toISOString()
    }));

    const response = await fetch(HISTORY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      window.alert(`Erreur lors de l'enregistrement : ${response.status} ${text}`);
    } else {
      window.alert('Sélection enregistrée pour suppression ultérieure.');
      // clear the table container
      if (container) {
        container.innerHTML = '<p>Tableau vidé après enregistrement.</p>';
      }
    }
  } catch (err) {
    console.error('Failed to log site selection:', err);
    window.alert('Erreur réseau lors de l\'enregistrement.');
  } finally {
    // cleanup spinner and restore position style
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (containerParent && prevPos === '') containerParent.style.position = '';
    else if (containerParent) containerParent.style.position = prevPos;
  }
}
