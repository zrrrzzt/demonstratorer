/*global L:false, turf:false */
var KR = this.KR || {};

/*
    Handles loading of datasets

    Init it with a KnreiseAPI, a Leaflet map, something that behaves as 
    L.Knreise.Control.Sidebar and an optional callback for errors.
*/
KR.DatasetLoader = function (api, map, sidebar, errorCallback) {
    'use strict';

    var reloads = [];

    var _defaults = {
        isStatic: true,
        bbox: true,
        cluster: true,
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
                if (_.has(dataset, 'provider')) {
                    feature.properties.provider = dataset.provider;
                }
                if (_.has(dataset, 'extras')) {
                    feature.properties = _.extend(feature.properties, dataset.extras);
                }
                feature.properties.feedbackForm = dataset.feedbackForm;
                if (_.has(dataset, 'mappings')) {
                    _.each(dataset.mappings, function (value, key) {
                        feature.properties[key] = feature.properties[value];
                    });
                }
            });
            return features;
        };
    }

    function _copyProperties(dataset) {
        var params = _.reduce(_.without(_.keys(dataset), 'datasets'), function (acc, key) {
            if (key !== 'style') {
                acc[key] = dataset[key];
            }
            return acc;
        }, {});

        if (dataset.style) {
            params.extras = params.extras || {};
            var groupId = KR.Util.stamp(dataset);
            params.extras.groupId = groupId
            KR.Style.groups[groupId] = dataset.style;
        }
        dataset.datasets  = _.map(dataset.datasets, function (dataset) {
            return _.extend({}, params, dataset);
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
            reloadFunc(true);
        });

        layer.on('show', function () {
            reloadFunc(true);
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

    function _isStatic(dataset) {
        if (dataset.datasets) {
            return _.filter(dataset.datasets, function (dataset) {
                return (dataset.isStatic === false);
            }).length === 0;
        }
        return dataset.isStatic;
    }

    function _checkLoadWhenLessThan(dataset) {
        var datasetList = [];
        if (dataset.datasets) {
            datasetList = dataset.datasets;
        } else {
            datasetList.push(dataset);
        }

        _.each(datasetList, function (dataset) {
            if (dataset.loadWhenLessThan) {

                var check = function () {
                    if (!dataset.geoJson) {
                        return;
                    }
                    var poly = turf.bboxPolygon(KR.Util.splitBbox(map.getBounds().toBBoxString()));
                    var inside = _.filter(dataset.geoJson.features, function (p) {
                        return turf.inside(p, poly);
                    });
                    if (inside.length <= dataset.loadWhenLessThan.count) {
                        dataset.loadWhenLessThan.callback(map, dataset, inside);
                    } else {
                        dataset.loadWhenLessThan.callback(map, dataset);
                    }
                };
                map.on('moveend', check);
                check();
            }
        });
    }


    function _initDataset(dataset, vectorLayer) {
        if (dataset.init) {
            dataset.init(map, dataset, vectorLayer);
        }
    }

    function _addDataset(dataset, filter, initBounds, loadedCallback) {
        var vectorLayer = _createVectorLayer(dataset, map);
        if (dataset.datasets) {
            dataset.datasets = _.filter(dataset.datasets, function (dataset) {
                return !dataset.noLoad;
            });
            _.each(dataset.datasets, function (dataset) {
                _initDataset(dataset, vectorLayer);
            });
        } else {
            _initDataset(dataset, vectorLayer);
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

        var lastBounds;

        var _reloadData = function (e, bbox, forceVisible, callback) {
            var first = !e;

            vectorLayer.enabled = _checkEnabled(dataset);
            vectorLayer.fire('changeEnabled');
            var shouldLoad = forceVisible || _checkShouldLoad(dataset);
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
                vectorLayer.isLoading = false;
                vectorLayer.fire('dataloadend');
                if (dataset.cluster) {
                    _resetClusterData(vectorLayer, featurecollections);
                } else {
                    _resetDataGeoJson(vectorLayer, featurecollections);
                }
                if (callback) {
                    callback();
                }
            });

            vectorLayer.isLoading = true;
            vectorLayer.fire('dataloadstart');
            _.each(toLoad, function (dataset) {
                var mapper = _mapper(dataset);

                function dataLoaded(geoJson) {
                    dataset.geoJson = geoJson;
                    vectorLayer.error = null;
                    if (filter) {
                        geoJson = filter(geoJson);
                    }
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
                }

                function loadError(error) {
                    vectorLayer.error = error;
                    finished();
                    //do not display errors for abort
                    if (error.statusText === 'abort') {
                        return;
                    }
                    if (errorCallback) {
                        errorCallback({
                            dataset: dataset.name,
                            error: error,
                            layer: vectorLayer
                        });
                    } else {
                        vectorLayer.fire('error', error);
                    }
                }

                //if this is not the first load, and dataset is static: do not load
                if ((!first && dataset.isStatic) || lastBounds === newBounds) {
                    dataLoaded(dataset.geoJson);
                    return;
                }

                //load according to strategy
                if (dataset.bbox) {
                    //hack for riksantikvaren
                    if (dataset.bboxFunc) {
                        dataset.bboxFunc(
                            api,
                            dataset.dataset,
                            newBounds,
                            dataLoaded,
                            loadError
                        );
                    } else {
                        api.getBbox(
                            dataset.dataset,
                            newBounds,
                            dataLoaded,
                            loadError
                        );
                    }
                } else {
                    api.getData(
                        dataset.dataset,
                        dataLoaded,
                        loadError
                    );
                }
            });
            lastBounds = newBounds;
        };

        _reloadData(null, initBounds, undefined, function () {
            _checkLoadWhenLessThan(dataset);
            if (loadedCallback) {
                loadedCallback();
            }
        });

        if (!_isStatic(dataset) || dataset.minZoom) {
            map.on('moveend', _reloadData);
        }

        _setupToggle(vectorLayer, _reloadData);

        return {layer: vectorLayer, reload: _reloadData};
    }

    function _setStyle(dataset) {
        var id = KR.Util.getDatasetId(dataset);
        dataset.extras = dataset.extras || {};
        dataset.extras.datasetId = id;
        if (dataset.style) {
            KR.Style.setDatasetStyle(id, dataset.style);
        }
    }

    /*
        Force a reload of all datasets, optionally set them visible after load
        calls callback when fihished
    */
    function reload(setVisible, callback) {
        var finished = _.after(reloads.length, function () {
            if (callback) {
                callback();
            }
        });
        _.each(reloads, function (reload) {
            reload(null, null, setVisible, finished);
        });
    }

    /*
        Loads a list of datasets, creates Leaflet layers of either 
        L.Knreise.GeoJSON or L.Knreise.MarkerClusterGroup according to
        config. 

        Can be supplied an initial bbox for filtering and a filter function
    */
    function loadDatasets(datasets, bounds, filter, loadedCallback) {

        datasets = _.filter(datasets, function (dataset) {
            return !dataset.noLoad;
        });

        var loaded;
        if (loadedCallback) {
            loaded = _.after(datasets.length, loadedCallback);
        }

        var res = _.map(datasets, function (dataset) {

            //extend with defaults
            dataset = _.extend({}, _defaults, dataset);

            //copy properties from parent
            if (dataset.datasets) {
                _copyProperties(dataset);
            }

            //set default style
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
            return _addDataset(dataset, filter, bounds, loaded);
        });
        reloads = _.pluck(res, 'reload');
        return _.pluck(res, 'layer');
    }

    return {
        loadDatasets: loadDatasets,
        reload: reload
    };
};
