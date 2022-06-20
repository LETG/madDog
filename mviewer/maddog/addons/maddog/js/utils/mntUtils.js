/**
 * This file is usefull to manage MNT panels interaction and MNT WMS layer.
 */
const mntUtils = (function () {
    // PRIVATE
    // This allow to display a browser console message when this file is correctly loaded
    const eventName = "mntUtils-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("MNT Utils lib loaded !"));
    // required and waiting by maddog.js PromisesAll
    document.dispatchEvent(create);
    /**
     * Get MNT WMS openLayers source
     * @returns ol.source
     */
    const mntSrc = () => mviewer.getLayer("mnt").layer.getSource();
    /**
     * Add or change MNT WMS request params like location CQL or TIME param.
     * @param {any} newParams 
     */
    const changeSourceParams = (newParams) => {
        mntSrc().updateParams({ ...mntSrc().getParams(), ...newParams });
        mntSrc().refresh();
    };
    // PUBLIC
    return {
        // dates from postgREST table
        dates: [],
        init: () => {
            // create selector options
            mntUtils.getDates();
            mntUtils.siteChange();
            mviewer.getLayer("mnt").layer.setVisible(true);
            mntSrc().refresh();
        },
        /**
         * To reset MNT
         * @param {boolean} close 
         */
        mntReset: (close) => {
            const params = mntSrc().getParams();
            delete params["CQL_FILTER"];
            delete params["TIME"];
            mntUtils.getDates();
        },
        /**
         * On close MNT panel
         */
        onClose: () => {
            mviewer.getLayer("mnt").layer.setVisible(false);
            mntSrc().refresh();
        },
        /**
         * Get dates from PostgREST api and construct select dates list.
         * Will display first date by default.
         * @returns Array
         */
        getDates: () => {
            if (!maddog.idsite) return [];
            // get all dates by idsite
            fetch(`${maddog.getCfg("config.options.postgrestapi")}/sitesurveydate?code_site=eq.${maddog.idsite}`)
                .then(response => response.text())
                .then(response => {
                    // clean select list
                    document.getElementById("dateMnt").innerHTML = "";
                    // dates are already ordered by date type in postgresql view
                    let datesJson = JSON.parse(response)
                    mntUtils.dates = datesJson;

                    // TODO comment this to use dates from API
                    // =====> comment this
                    if (maddog.idsite === "BOUTRO") {
                        mntUtils.dates = [
                            { date_survey: "2007-03-07" },
                            { date_survey: "2007-02-16" },
                            { date_survey: "2007-02-05" },
                            { date_survey: "2006-12-20" },
                            { date_survey: "2006-12-08" },
                            { date_survey: "2006-11-28" },                           
                        ];
                    }
                    if (maddog.idsite === "VOUGOT") {
                        mntUtils.dates = [
                            { date_survey: "2017-08-25" },
                            { date_survey: "2005-07-01" },                            
                        ];
                    }
                    datesJson = mntUtils.dates;
                    // <=============== END TO COMMENT
                    
                    // add dates to list
                    $('#dateMnt').append(
                        datesJson.map((date, i) => {
                            const dateText = new Date(moment(date.date_survey, "YYYY-MM-DD")).toLocaleDateString();
                            if (i < 1) {
                                mntUtils.date = date.date_survey;
                            }
                            return `<option value="${date.date_survey}" ${i === 0 ? "selected" : ""}>${dateText}</option>`
                        })
                        .join("")
                    );
                    // update layer with first list value by default
                    mntUtils.updateLayer();
                })
        },
        /**
         * get mnt source
         */
        getMNTSource: mntSrc,
        /**
         * On selecte date value change
         * @param {Object} d - from event select element 
         * @returns update WMS layer with correct id site or correct date
         */
        dateChange: (d) => {
            mntUtils.date = d?.value;
            if (!maddog.idsite || ! mntUtils.date) {
                return mntUtils.mntReset();
            };
            // create CQL - use searchParametersURL API
            mntUtils.updateLayer();
        },
        /**
         * Update WMS MNT params according selected site and selected date (first by default)
         */
        updateLayer: () => {
            changeSourceParams({
                CQL_FILTER: `location like '%${maddog.idsite}%'`
            });
            if (mntUtils.date) {
                changeSourceParams({ time:  mntUtils.date });
            }
        },
        /**
         * Will be trigger on site click event
         * @returns update WMS layer with correct id site or correct date
         */
        siteChange: () => {
            mntUtils.getDates();
            // change custom layer params to add CQL
            if (!maddog.idsite) return;
            mntUtils.updateLayer();
        }
    }
})()