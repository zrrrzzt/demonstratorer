/*global turf:false, L:false */
var KR = this.KR || {};

(function (ns) {
    'use strict';

    /*
        Setup for a "follow line map demonstrator"
    */
    ns.FollowLineMap = function (map, api, sidebar, datasets, options) {

        options = _.extend({
            zoom: 15
        }, options || {});

        var previewStrip = new KR.PreviewStrip(
            $('#strip'),
            map,
            null,
            null,
            null,
            {
                panOnClick: false,
                minimal: true
            }
        );


        var markerLayer = L.Knreise.geoJson().addTo(map);

        markerLayer.on('click', function (e) {
            var feature = e.layer.feature;
            if (sidebar) {
                sidebar.showFeature(feature);
            }
        });

        function _gotFeatures(features, position) {

            features = KR.Util.distanceAndSort(features, turf.point([position.lng, position.lat]));

            if (features.features.length > 200) {
                features = KR.Util.createFeatureCollection(_.first(features.features, 200));
            }

            markerLayer.clearLayers().addData(features);

            previewStrip.showFeatures(markerLayer.getLayers());
            if (!features.features.length) {
                previewStrip.showMessage('<em>Ingen funnet!</em>');
            }

        }

        var marker;
        function _updateMarker(position) {
            if (!marker) {
                if (options.markerFunction) {
                    marker = options.markerFunction(position);
                    marker.addTo(map);
                    marker.setZIndexOffset(1000);
                } else if (options.circleStyle) {
                    marker = L.circleMarker(
                        position,
                        options.circleStyle
                    ).addTo(map);
                } else if (options.icon) {
                    marker = L.marker(position, {icon: options.icon});
                    marker.setZIndexOffset(1000);
                } else {
                    marker = L.marker(position).addTo(map);
                    marker.setZIndexOffset(1000);
                }
            } else {
                marker.setLatLng(position);
            }
        }

        function _datasetLoader(bbox, loadedFunc, errorCallback, dataset) {
            var id = KR.Util.getDatasetId(dataset);
            if (dataset.style) {
                KR.Style.setDatasetStyle(id, dataset.style);
            }
            function datasetLoaded(features) {
                _.each(features.features, function (feature) {
                    feature.properties.datasetId = id;
                    feature.template = dataset.template;
                    if (!feature.properties.provider) {
                        feature.properties.provider = dataset.provider;
                    }
                    if (!feature.properties.contentType) {
                        feature.properties.contentType = dataset.contentType;
                    }
                });

                loadedFunc(features);
            }

            if (dataset.bboxFunc) {
                dataset.bboxFunc(
                    api,
                    dataset.dataset,
                    bbox,
                    datasetLoaded,
                    errorCallback
                );
            } else {
                api.getBbox(
                    dataset.dataset,
                    bbox,
                    datasetLoaded,
                    errorCallback,
                    {allPages: false}
                );
            }
        }

        function positionChanged(position) {
            previewStrip.moveStart();
            map.setZoom(options.zoom);
            map.panTo(position);
            _updateMarker(position);

            previewStrip.setPosition(position);

            var found = [];
            var featuresLoaded = _.after(datasets.length, function () {
                _gotFeatures(KR.Util.createFeatureCollection(found), position);
            });

            function errorCallback() {
                previewStrip.showMessage('En feil oppstod!');
                featuresLoaded();
            }

            var bbox = map.getBounds().toBBoxString();
            function datasetLoaded(features) {
                features = KR.Util.filterByBbox(features, bbox);
                found = found.concat(features.features);
                featuresLoaded();
            }
            _.each(datasets, function (dataset) {
                _datasetLoader(bbox, datasetLoaded, errorCallback, dataset);
            });
        }

        return {
            positionChanged: positionChanged
        };
    };

}(KR));
