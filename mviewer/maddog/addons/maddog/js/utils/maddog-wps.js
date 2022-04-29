const wps = (function () {
    const eventName = "maddog-wps-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("maddog-wps lib loaded !"))
    document.dispatchEvent(create);
    
    return {
        init: (component) => {
            this.getCfg = (i) => _.get(mviewer.customComponents[component], i);
        },
        getCapabilities: (type = "GET", cb = (response) => {}, wps) => {
            if (!wps) return {};
            return wps.getCapabilities_POST(cb);
        },
        createWpsService: (config) => new WpsService(config),
        describe: (process, wps, cb = () => {}) => {
            return wps.describeProcess_POST(cb, process);
        },
        drawRadial: ({
            callback = () => {},
            wpsService = null,
            referenceLine = {}, // geojson in <![CDATA]> like <![CDATA{geojson}]>
            radialLength = 100,
            radialDistance = 10,
            radialDirection = true,
            processIdentifier = "coa:drawRadial",
            executionMode = "async",
            lineage = false
        }) => {
            // const lineref = '<![CDATA[{"type":"FeatureCollection","features":[{"type":"Feature","id":"lineref.8","geometry":{"type":"LineString","coordinates":[[152059.7779,6863515.198],[152063.7083,6863506.068],[152063.9357,6863488.96],[152057.5771,6863467.537],[152045.7074,6863439.607],[152019.9777,6863407.949],[151959.6231,6863358.466],[151885.0617,6863317.661],[151791.9543,6863278.433],[151670.1483,6863220.874],[151617.0797,6863189.891],[151568.1792,6863144.599],[151497.3646,6863036.668],[151393.3409,6862881.891],[151305.2707,6862758.394],[151227.4553,6862667.65],[151118.1207,6862562.882],[150981.7434,6862468.323],[150877.0335,6862406.345],[150812.3509,6862351.186]]},"geometry_name":"geom","properties":{"ogc_fid":8,"idsite":"VOUGOT","creationdate":null}}],"totalFeatures":1,"numberMatched":1,"numberReturned":1,"timeStamp":"2022-04-27T14:09:00.059Z","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::2154"}}}]]>';
            if (!wpsService || _.isEmpty(referenceLine)) return {};

            let inputGenerator = new InputGenerator();

            let inputs = Object.values({
                lineref: inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                    "referenceLine",
                    "application/json",
                    "",
                    null,
                    false,
                    referenceLine
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
            wps.coastLineTracking(maddog.coastLinesTrackingConfig);
        },
        coastLineTracking: ({
            callback = () => {},
            wpsService = null,
            referenceLine = {}, // geojson in <![CDATA]> like <![CDATA{geojson}]>
            radialLength = 100,
            radialDistance = 10,
            radialDirection = true,
            processIdentifier = "coa:coastLinesTracking",
            executionMode = "async",
            lineage = false,
            tdc = {} // geojson in <![CDATA]> like <![CDATA{geojson}]>
        }) => {
             if (!wpsService || _.isEmpty(referenceLine) || _.isEmpty(tdc)) return {};

            let inputGenerator = new InputGenerator();

            let inputs = Object.values({
                referenceLine: inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                    "referenceLine",
                    "application/json",
                    "",
                    null,
                    false,
                    referenceLine
                ),
                radialLength: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("radialLength", null, null, radialLength),
                radialDistance: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("radialDistance", null, null, radialDistance),
                radialDirection: inputGenerator.createLiteralDataInput_wps_1_0_and_2_0("radialDirection", null, null, radialDirection),
                coaslines: inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                    "coaslines",
                    "application/json",
                    "",
                    null,
                    false,
                    tdc
                )
            });

            var outputGenerator = new OutputGenerator();
            var complexOutput = outputGenerator.createComplexOutput_WPS_1_0(
                "csvString",
                "text/csv", 
                null,
                null,
                null,
                false,
                null,
                null);
            var outputs = [complexOutput];
            wpsService.execute(callback, processIdentifier, "raw", executionMode, lineage, inputs, outputs);
        }
    }
})();