/*global L:false */
var KR = this.KR || {};

KR.DatasetLoader = function (api, map, sidebar, errorCallback) {
    'use strict';

    var _defaults = {
        isStatic: true,
        bbox: true,
        cluster: true,
      //  smallMarker: false,
      //  thumbnails: true,
        visible: true
    };

    var _addClusterClick, _addFeatureClick;
    if (sidebar) {
        _addClusterClick = KR.Util.clusterClick(sidebar);
        _addFeatureClick = KR.Util.featureClick(sidebar);
    }

    function _mapper(dataset) {
        var id = KR.Util.stamp(dataset);
        return function (features) {
            if (!features || !features.features.length) {
                return features;
            }
            _.each(features.features, function (feature) {
                feature.properties.datasetID = id;
                if (_.has(dataset, 'circle')) {
                    feature.properties.circle = dataset.circle;
                }
/*                if (_.has(dataset, 'dataset_name_override')) {
                    feature.properties.dataset = dataset.dataset_name_override;
                }
*/
                if (_.has(dataset, 'provider')) {
                    feature.properties.provider = dataset.provider;
                }
                if (_.has(dataset, 'extras')) {
                    feature.properties = _.extend(feature.properties, dataset.extras);
                }

            });
            return features;
        };
    }

    function _copyProperties(dataset) {
        var params = _.reduce(_.without(_.keys(dataset), 'datasets'), function (acc, key) {
            acc[key] = dataset[key];
            return acc;
        }, {});
        _.each(dataset.datasets, function (dataset) {
            _.extend(dataset, params);
        });
        return dataset;
    }

    function _createGeoJSONLayer(geoJson, dataset) {
        var options = {
            dataset: dataset,
            onEachFeature: function (feature, layer) {
                if (_addFeatureClick) {
                    _addFeatureClick(feature, layer, dataset);
                }
            }
        };
        if (dataset.style) {
            options.style = dataset.style;
        }
        return L.Knreise.geoJson(geoJson, options);
    }

    function _resetDataGeoJson(layer, featurecollections) {
        layer.clearLayers();
        var features = _.reduce(featurecollections, function (acc, data) {
            return acc.concat(data.toGeoJSON().features);
        }, []);
        layer.addData(KR.Util.createFeatureCollection(features));
    }

    function _resetClusterData(clusterLayer, featurecollections) {
        clusterLayer.clearLayers();
        var layers = _.reduce(featurecollections, function (acc, geoJSONLayer) {
            geoJSONLayer.setMap(map);
            return acc.concat(geoJSONLayer.getLayers());
        }, []);
        clusterLayer.addLayers(layers);
    }

    function _setupToggle(layer, reloadFunc) {
        layer.on('hide', function () {
            reloadFunc();
        });

        layer.on('show', function () {
            reloadFunc();
        });
    }

    function _createVectorLayer(dataset, map) {
        var vectorLayer;
        if (dataset.cluster) {
            vectorLayer = new L.Knreise.MarkerClusterGroup({dataset: dataset}).addTo(map);
            if (_addClusterClick) {
                _addClusterClick(vectorLayer, dataset);
            }
        } else {
            vectorLayer = _createGeoJSONLayer(null, dataset).addTo(map);
        }
        var enabled = true;
        if (dataset.minFeatures) {
            enabled = false;
        }
        vectorLayer.enabled = enabled;
        return vectorLayer;
    }

    function _toggleEnabled(vectorLayer, enabled) {

        if (vectorLayer.enabled !== enabled) {
            vectorLayer.enabled = enabled;
            vectorLayer.fire('changeEnabled');
        }
    }

    function _getvisible(dataset) {
        if (dataset.datasets && !dataset.grouped) {
            var numVisible = _.filter(dataset.datasets, function (d) {
                return d.visible;
            }).length;
            return (numVisible > 0);
        }

        return dataset.visible;
    }

    function _checkShouldLoad(dataset) {
        if (!dataset.minZoom) {
            return _getvisible(dataset);
        }

        if (map.getZoom() < dataset.minZoom) {
            return false;
        }
        return _getvisible(dataset);
    }

    function _checkEnabled(dataset) {
        if (!dataset.minZoom) {
            return true;
        }

        if (map.getZoom() < dataset.minZoom) {
            return false;
        }
        return true;
    }


    function _addBboxDataset(dataset, initBounds) {
        var vectorLayer = _createVectorLayer(dataset, map);

        //copy properties from parent
        if (dataset.datasets) {
            _copyProperties(dataset);
        }

        function checkData(geoJson, vectorLayer) {
            if (dataset.minFeatures) {
                if (geoJson.numFound && dataset.minFeatures < geoJson.numFound) {
                    _toggleEnabled(vectorLayer, false);
                    return KR.Util.createFeatureCollection([]);
                }
                _toggleEnabled(vectorLayer, true);
            }
            return geoJson;
        }

        function _reloadData(e, bbox) {

            vectorLayer.enabled = _checkEnabled(dataset);
            vectorLayer.fire('changeEnabled');
            var shouldLoad = _checkShouldLoad(dataset);
            if (!shouldLoad) {
                vectorLayer.clearLayers();
                return;
            }

            var newBounds = bbox || map.getBounds().toBBoxString();
            var toLoad;
            if (dataset.datasets) {
                toLoad = _.filter(dataset.datasets, function (d) {
                    return d.visible;
                });
            } else {
                toLoad = [dataset];
            }

            var featurecollections = [];
            var finished = _.after(toLoad.length, function () {
                if (dataset.cluster) {
                    _resetClusterData(vectorLayer, featurecollections);
                } else {
                    _resetDataGeoJson(vectorLayer, featurecollections);
                }
            });
            _.each(toLoad, function (dataset) {
                var mapper = _mapper(dataset);
                api.getBbox(
                    dataset.dataset,
                    newBounds,
                    function (geoJson) {
                        var geoJSONLayer;
                        if (dataset.cluster) {
                            geoJSONLayer = _createGeoJSONLayer(
                                mapper(checkData(geoJson, vectorLayer)),
                                dataset
                            );
                            dataset.geoJSONLayer = geoJSONLayer;
                        } else {
                            geoJSONLayer = L.geoJson(mapper(checkData(geoJson, vectorLayer)));
                        }
                        featurecollections.push(geoJSONLayer);
                        finished();
                    },
                    function (error) {
                        if (errorCallback) {
                            errorCallback({
                                dataset: dataset.name,
                                error: error
                            });
                        }
                    }
                );
            });
        }

        _reloadData(null, initBounds);

        if (!dataset.isStatic || dataset.minZoom) {
            map.on('moveend', _reloadData);
        }

        _setupToggle(vectorLayer, _reloadData);

        return vectorLayer;
    }

    function _addFullDataset(dataset) {
        var mapper = _mapper(dataset);
        var vectorLayer = _createVectorLayer(dataset, map);

        api.getData(
            dataset.dataset,
            function (geoJson) {
                var geoJSONLayer = _createGeoJSONLayer(
                    mapper(geoJson),
                    dataset
                );
                vectorLayer.clearLayers();
                vectorLayer.addLayers(geoJSONLayer.getLayers());
            },
            function (error) {
                if (errorCallback) {
                    errorCallback({
                        dataset: dataset.name,
                        error: error
                    });
                }
            }
        );
        return vectorLayer;
    }

    function _getDatasetId(dataset) {
        if (dataset.dataset.api === 'norvegiana') {
            if (!dataset.dataset.query) {
                return dataset.dataset.dataset;
            }
        }
        if (dataset.id) {
            return dataset.id;
        }
        return KR.Util.stamp(dataset);
    }

    function _setStyle(dataset) {
        var id = _getDatasetId(dataset);
        dataset.extras = dataset.extras || {};
        dataset.extras.datasetId = id;
        if (dataset.style) {
            KR.Style.setDatasetStyle(id, dataset.style);
        }
    }

    function loadDatasets(datasets, bounds) {
        return _.map(datasets, function (dataset) {
            dataset = _.extend({}, _defaults, dataset);

            if (KR.Style.setDatasetStyle) {
                if (dataset.datasets) {
                    _.each(dataset.datasets, _setStyle);
                } else {
                    _setStyle(dataset);
                }
            }

            if (!dataset.visible) {
                dataset.notLoaded = true;
            }
            if (dataset.minZoom && dataset.bbox) {
                dataset.isStatic = false;
            }
            if (dataset.bbox) {
                return _addBboxDataset(dataset, bounds);
            }
            return _addFullDataset(dataset);
        });
    }

    return {
        loadDatasets: loadDatasets
    };
};
