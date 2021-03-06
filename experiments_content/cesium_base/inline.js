
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


var map = new KR.CesiumMap(
    'cesium',
    cesiumOptions
);

map.viewer.scene.imageryLayers.removeAll();
var provider = map.getWmts(
    'http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts',
    'topo2',
    {
        TILEMATRIXSET: 'EPSG:3857',
        TILEMATRIX: 'EPSG:3857:{TileMatrix}',
        FORMAT: 'image/png'
    }
);
map.addImageryProvider(provider);

map.addMarkers([
    {
        pos: {lat: 61.903449584557976, lng: 6.719534397125244},
        text: 'Stryn',
        icon: '../common/img/marker-icon-green.png'
    }
]);

// Rough outline for a building in Stryn
var building = [6.715291142463684, 61.900781568986325, 60, 6.715092658996582, 61.90066281667221, 60, 6.714212894439697, 61.900442997342445, 60, 6.714287996292114, 61.90037983057622, 60, 6.713864207267761, 61.90027371011537, 60, 6.713837385177612, 61.90031161032221, 60, 6.713719367980957, 61.90028381684177, 60, 6.713773012161255, 61.90024591660051, 60, 6.713740825653076, 61.90020801631225, 60, 6.7128986120224, 61.90001346076016, 60, 6.712764501571655, 61.90015495582985, 60, 6.71289324760437, 61.90019285618381, 60, 6.712791323661804, 61.90029392356487, 60, 6.712930798530579, 61.90032677039183, 60, 6.712914705276489, 61.90036214385832, 60, 6.712968349456787, 61.900374777229295, 60, 6.71288788318634, 61.90046573734636, 60, 6.712566018104553, 61.90038741059507, 60, 6.712077856063843, 61.90082452183749, 60, 6.712362170219421, 61.9009053740996, 60, 6.712292432785034, 61.90096095990585, 60, 6.7127376794815055, 61.90107718444708, 60, 6.7129576206207275, 61.90089021431674, 60, 6.712828874588013, 61.90084726155781, 60, 6.713005900382995, 61.90070829633634, 60, 6.713719367980957, 61.900885161054106, 60, 6.713864207267761, 61.900738616074854, 60, 6.714009046554565, 61.900781568986325, 60, 6.713515520095825, 61.90121109478409, 60, 6.714266538619995, 61.90140816930827, 60, 6.714969277381897, 61.900789148905616, 60, 6.715237498283386, 61.90085484146084, 60, 6.715291142463684, 61.900781568986325, 60];

var strynBuilding = map.viewer.entities.add({
    name : 'Stryn Building',
    polygon : {
        hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights(building),
        extrudedHeight: 0,
        perPositionHeight : true,
        material : Cesium.Color.BLUE,
        outline : true,
        outlineColor : Cesium.Color.BLACK
    }
});

map.viewer.zoomTo(strynBuilding);
map.stopLoading();
