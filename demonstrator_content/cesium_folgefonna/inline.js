function simplify(geojson) {
    return turf.featurecollection([turf.simplify(
        geojson.features[0], 0.001, false
    )]);
}


function createPolyline(heightCurve, options) {
    options = options || {};
    return {
        polyline: {
            positions: heightCurve,
            width: options.width || 10.0,
            material: new Cesium.PolylineGlowMaterialProperty({
                color: options.color || Cesium.Color.BLUE ,
                glowPower: options.glow || 0.1,
            })
        }
    };
}

var cesiumOptions = {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false,
    orderIndependentTranslucency: false
};

var datasets = [
    {
        api: 'kulturminnedata',
        layer: 0
    },
    {
        api: 'wikipedia'
    }
];

var tur = {
    api: 'utno',
    id: '2.8158',
    type: 'gpx'
};


function Playpause() {
    var btn = $('#playpause');

    function play() {
        btn.find('.glyphicon').removeClass('glyphicon-play').addClass('glyphicon-pause');
        pathTracer.start();
    }

    function pause () {
        btn.find('.glyphicon').removeClass('glyphicon-pause').addClass('glyphicon-play');
        pathTracer.stop();
    }

    function toggle() {
        if (pathTracer.isRunning()) {
            pause();
        } else {
            play();
        }
    }

    return {
        play: play,
        pause: pause,
        toggle: toggle
    };
}

var wasRunning = false;
var playpause = new Playpause();


function closed() {
    if (pathTracer && wasRunning) {
        playpause.play();
    }
}

// Setting up API and retrieving the Folgefonna geojson
var api = new KR.API();
var pathTracer;
var sidebar = KR.CesiumSidebar($('#cesium-sidebar'), {
    wikipediaTemplate: _.template($('#cesium_wikipedia_template').html()),
    arcKulturminneTemplate: _.template($('#cesium_arc_kulturminne_template').html()),
    sparqlKulturminneTemplate: _.template($('#cesium_sparql_kulturminne_template').html())
}, closed);


api.getData(tur, function (geojson) {
    var bbox = KR.CesiumUtils.getBounds(geojson);
    var map = new KR.CesiumMap(
        'cesium-viewer',
        cesiumOptions,
        bbox
    );

    map.viewer.scene.imageryLayers.removeAll();
    map.addNorgeIBilder();
    map.stopLoading();

    var simple = simplify(geojson);
    map.build3DLine(simple, function (heightCurve) {
        pathTracer = new KR.PathTracer(map.viewer, heightCurve, simple);
        pathTracer.setPitchCorr(0.1);
        $('#playpause').click(playpause.toggle);
    });

    map.build3DLine(geojson, function (heightCurve) {

        var line = createPolyline(heightCurve, {
            color: Cesium.Color.DEEPSKYBLUE,
            glow: 0.25
        });
        var folgefonna = map.viewer.entities.add(line);

        map.viewer.zoomTo(folgefonna);

        _.each(datasets, function (dataset) {
            map.loadDataset(dataset, bbox, api, function (res) {
                map.viewer.dataSources.add(res);
            });
        });

        map.stopLoading();
        $('#playpause').removeClass('hidden');

        map.addClickhandler(function (properties) {

            wasRunning = pathTracer.isRunning();
            playpause.pause();

            pathTracer.stop();
            sidebar.show(properties);
        });
    });

});
