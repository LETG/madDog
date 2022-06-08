const wps = (function () {
    // This allow to display a browser console message when this file is correctly loaded
    const eventName = "maddog-wps-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("maddog-wps lib loaded !"));
    // required and waiting by maddog.js PromisesAll
    document.dispatchEvent(create);

    return {
        /**
         * 
         * @param {string} component mviewer id
         */
        init: (component) => {
            this.getCfg = (i) => _.get(mviewer.customComponents[component], i);
        },
        /**
         * 
         * @param {string} type REST as POST or GET
         * @param {any} cb callback function
         * @param {*} wps 52North WPS instance
         * @returns get capabilities response
         */
        getCapabilities: (type = "GET", cb = (response) => {}, wps) => {
            if (!wps) return {};
            return wps.getCapabilities_POST(cb);
        },
        /**
         * Create a new 52North WPS instance for a specifif config
         * @param {any} config object
         * @returns wps instance
         */
        createWpsService: (config) => new WpsService(config),
        /**
         * To get describe process
         * @param {*} process 
         * @param {*} wps 
         * @param {*} cb 
         * @returns 
         */
        describe: (process, wps, cb = () => {}) => {
            return wps.describeProcess_POST(cb, process);
        },
        /**
         * Draw Radial WPS.
         * - Config object is define in maddog.js.
         * - This WPS is trigger when user click on button and pass drawRadialConfig object
         * Execute a callback pass from maddog.js file.
         * @param {Object} drawRadialConfig an object wich contain every WPS params
         * @returns nothing
         */
        drawRadial: ({
            callback = () => {},
            wpsService = null,
            referenceLine = null, // geojson in <![CDATA]> like <![CDATA{geojson}]>
            drawReferenceLine = null,
            radialLength = 100,
            radialDistance = 10,
            radialDirection = true,
            processIdentifier = "coa:drawRadial",
            executionMode = "async",
            lineage = false
        }) => {
            // show loader
            document.dispatchEvent(wps.startEvent);
            $('.tdcNavTabs a[href="#tdcTabGraph"]').tab('show');
            const jsonRefline = drawReferenceLine || referenceLine;
            // const lineref = '<![CDATA[{"type":"FeatureCollection","features":[{"type":"Feature","id":"lineref.8","geometry":{"type":"LineString","coordinates":[[152059.7779,6863515.198],[152063.7083,6863506.068],[152063.9357,6863488.96],[152057.5771,6863467.537],[152045.7074,6863439.607],[152019.9777,6863407.949],[151959.6231,6863358.466],[151885.0617,6863317.661],[151791.9543,6863278.433],[151670.1483,6863220.874],[151617.0797,6863189.891],[151568.1792,6863144.599],[151497.3646,6863036.668],[151393.3409,6862881.891],[151305.2707,6862758.394],[151227.4553,6862667.65],[151118.1207,6862562.882],[150981.7434,6862468.323],[150877.0335,6862406.345],[150812.3509,6862351.186]]},"geometry_name":"geom","properties":{"ogc_fid":8,"idsite":"VOUGOT","creationdate":null}}],"totalFeatures":1,"numberMatched":1,"numberReturned":1,"timeStamp":"2022-04-27T14:09:00.059Z","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::2154"}}}]]>';
            if (!wpsService || _.isEmpty(jsonRefline)) return {};

            let inputGenerator = new InputGenerator();

            let inputs = Object.values({
                lineref: inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                    "referenceLine",
                    "application/json",
                    "",
                    null,
                    false,
                    jsonRefline
                ),
                radialLength: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("radialLength", null, null, radialLength),
                radialDistance: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("radialDistance", null, null, radialDistance),
                radialDirection: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("radialDirection", null, null, radialDirection)
            });

            var outputGenerator = new OutputGenerator();
            var complexOutput = outputGenerator.createComplexOutput_WPS_1_0(
                "resulFeatureCollection",
                "application/json",
                null,
                null,
                null,
                false,
                null,
                null);
            var outputs = [complexOutput];
            wpsService.execute(callback, processIdentifier, "raw", executionMode, lineage, inputs, outputs);
            $("#coastlinetrackingBtn").hide();
        },
        /**
         * Coast Line tracking WPS.
         * - Config object is define in maddog.js.
         * - This WPS is trigger when user click on button and pass coastLinesTrackingConfig object
         * Execute a callback pass from maddog.js file.
         * @param {Object} coastLinesTrackingConfig an object wich contain every WPS params
         * @returns nothing
         */
        coastLineTracking: ({
            callback = () => {},
            wpsService = null,
            radiales = {}, // geojson in <![CDATA]> like <![CDATA{geojson}]>
            processIdentifier = "coa:coastLinesTracking",
            executionMode = "async",
            lineage = false,
            tdc = {} // geojson in <![CDATA]> like <![CDATA{geojson}]>
        }) => {
            if (!wpsService || _.isEmpty(radiales) || _.isEmpty(tdc)) return {};

            let inputGenerator = new InputGenerator();
            // INPUTS
            let inputs = Object.values({
                radiales: inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                    "radiales",
                    "application/json",
                    "",
                    null,
                    false,
                    radiales
                ),
                coastlines: inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                    "coastlines",
                    "application/json",
                    "",
                    null,
                    false,
                    tdc
                )
            });
            // OUTPUTS
            var outputGenerator = new OutputGenerator();
            var complexOutput = outputGenerator.createComplexOutput_WPS_1_0(
                "jsonString",
                "application/json",
                null,
                null,
                null,
                false,
                null,
                null);
            var outputs = [complexOutput];
            // EXECUTE
            wpsService.execute(callback, processIdentifier, "raw", executionMode, lineage, inputs, outputs);
        },
        /**
         * Beach profile tracking WPS.
         * - Config object is define in maddog.js.
         * - This WPS is trigger when user click on button and pass beachProfileTrackingConfig object
         * Execute a callback pass from maddog.js file.
         * @param {Object} beachProfileTrackingConfig an object wich contain every WPS params
         * @returns nothing
         */
        beachProfileTracking: ({
            callback = () => {},
            wpsService = null,
            processIdentifier = "BeachProfile:BeachProfileTracking",
            executionMode = "async",
            lineage = false,
            fc = {}, // geojson in <![CDATA]> like <![CDATA{geojson}]>,,
            interval = 0.1,
            minDist = 0,
            maxDist = 0,
            useSmallestDistance = true
        }) => {
            document.dispatchEvent(wps.startEvent);
            $('.ppNavTabs a[href="#ppTabGraph"]').tab('show');
            if (!wpsService || _.isEmpty(fc)) return {};
            let inputGenerator = new InputGenerator();
            // INPUTS
            let inputs = Object.values({
                fc: inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                    "fc",
                    "application/json",
                    "",
                    null,
                    false,
                    fc
                ),
                interval: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("interval", null, null, interval),
                useSmallestDistance: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("useSmallestDistance", null, null, useSmallestDistance),
                minDist: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("minDist", null, null, minDist),
                maxDist: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("maxDist", null, null, minDist)
            });
            // OUTPUTS
            var outputGenerator = new OutputGenerator();
            var complexOutput = outputGenerator.createComplexOutput_WPS_1_0(
                "result",
                "application/json",
                null,
                null,
                null,
                false,
                null,
                null);
            var outputs = [complexOutput];
            // EXECUTE WPS with 42North lib
            wpsService.execute(callback, processIdentifier, "raw", executionMode, lineage, inputs, outputs);
        },
        startEvent: new Event("start-wps"),
        stopEvent: new Event("stop-wps")
    }
})();