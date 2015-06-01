

var config = {
    
    cesiumViewerOpts : {
        timeline: false, 
        baseLayerPicker: false, 
        geocoder : false, 
        infoBox: false, 
        animation: false,
        orderIndependentTranslucency: false
    }
    
}

var viewer = new Cesium.Viewer('cesium', config.cesiumViewerOpts);
    


// Add the terrain provider (AGI)
var cesiumTerrainProviderMeshes = new Cesium.CesiumTerrainProvider({
    url : '//assets.agi.com/stk-terrain/world',
    requestWaterMask : true,
    requestVertexNormals : true
});
viewer.terrainProvider = cesiumTerrainProviderMeshes;


// Add kartverket WMTS
var kartverketTopo2 = new Cesium.WebMapTileServiceImageryProvider({
    url : 'http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?SERVICE=WMTS&REQUEST=GetTile&LAYER=matrikkel_bakgrunn&STYLE={Style}&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&FORMAT=image/png',
    layer : 'matrikkel_bakgrunn',
    style : 'default',
    version : "1.0.0",
    format : 'image/png',
    tileMatrixSetID : 'EPSG:3857',
    maximumLevel: 19
});

viewer.imageryLayers.addImageryProvider(kartverketTopo2);

var api = new KR.API({
    cartodb: {
        apikey: 'e6b96c1e6a71b8b2c6f8dbb611c08da5842f5ff5',
        user: 'knreise'
    }
});

console.log(api);

var dataset = {
    api: 'norvegiana',
    dataset: 'Kulturminnesok'
};



var mouseHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas); 
mouseHandler.setInputAction( function(movement){ 
    console.log(movement);
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);  


var stryn = viewer.entities.add({
  name : 'Stryn',
  polygon : {
    hierarchy : Cesium.Cartesian3.fromDegreesArray([
      6.86339933569173,61.9377705837496,
      6.86064458723271,61.9406402731954,
      6.8571895811401,61.9441772873158,
      6.86087979967812,61.9447979617182,
      6.86344624795662,61.9423909615729,
      6.86447518088584,61.942406380056]),
    material : Cesium.Color.RED.withAlpha(0.5),
    outline : true,
    outlineColor : Cesium.Color.BLACK
  }
});


/*
function getHeight(cartographicPosition) {
    var samples = Cesium.sampleTerrain(viewer.terrainProvider, 9, [certographicPosition]) {
        console.log(samples);
    return samples[0];
}

var addMouseHandler = function(scene) {

        var animation;
        var handler = new EventHandler(scene.getCanvas());
        var pickedObject;

        handler.setMouseAction(

            function(movement) {

                    console.log("scene=" + scene); // exists
                    pickedObject = scene.pick(movement.endPosition);  // fails here as this will in turn call Scene.prototype.pick()
                    console.log("pickedObject=" + pickedObject);
                    console.log("pickedObject.isBillboard=" + pickedObject.isPlatform)
                    if ((pickedObject) && !pickedObject.isPlatform && !pickedObject.highlighted) {
                        
                    }
                    
            }
            
}

*/

/*
function addMarker(lon, lat) {
    
    var position = Cesium.Cartographic.fromDegrees(lon, lat);
    var entity = viewer.entities.add({
        position : position,
        label : false,
        billboard : {
            image : '../common/img/marker-icon-green.png',
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
        }
    });
        
        
    var promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, [position]);

    Cesium.when(promise, function(updatedPositions) {
        console.log(updatedPositions);
        console.log(position);
        // positions[0].height and positions[1].height have been updated.
        // updatedPositions is just a reference to positions.
    });


 addMarker(6.86339933569173,61.9377705837496);
    
}
*/





var addMarker(lon, lat) {
    
    var positions = [
        Cesium.Cartographic.fromDegrees(6.86339933569173,61.9377705837496)
    ];
    
    var promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, positions);
    promise.id = 123;
    
    var markerPos = Cesium.Cartesian3.fromDegrees(lon, lat);
        
        
    
    var entity = viewer.entities.add({
        position : markerPos,
        label : false,
        billboard : {
            image : '../common/img/marker-icon-green.png',
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
        }
    });
    
}



var markerPos = Cesium.Cartesian3.fromDegrees(6.86339933569173,61.9377705837496);
var entity = viewer.entities.add({
        position : markerPos,
        label : false,
        billboard : {
            image : '../common/img/marker-icon-green.png',
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
        }
    });
    

var positions = [
    Cesium.Cartographic.fromDegrees(6.86339933569173,61.9377705837496)
];
var promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, positions);
Cesium.when(promise, function(updatedPositions) {
    
    console.log(markerPos.height);
    console.log(updatedPositions);
    
    entity.height = updatedPositions[0].height;
    console.log(updatedPositions[0].height);
    
    console.log(markerPos.height);
    // positions[0].height and positions[1].height have been updated.
    // updatedPositions is just a reference to positions.
});











viewer.zoomTo(stryn);

    