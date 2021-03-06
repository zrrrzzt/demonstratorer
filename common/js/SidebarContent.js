/*global audiojs:false, turf:false*/

var KR = this.KR || {};

/*
    Handles display of content in a sidebar
*/

KR.SidebarContent = function (wrapper, element, top, options) {
    'use strict';
    var map;
    var defaultTemplate = KR.Util.getDatasetTemplate('popup');

    element = $(element);
    wrapper = $(wrapper);
    top = $(top);

    function _setContent(content) {
        element.html(content);
    }

    function _setupSwipe(callbacks) {
        if (!callbacks) {
            return;
        }
        element
            .swipe({
                swipe: function () {},
                allowPageScroll: 'vertical'
            })
            .off('swipeLeft')
            .on('swipeLeft', function () {
                if (callbacks.next) {
                    callbacks.next();
                }
            })
            .off('swipeRight')
            .on('swipeRight', function () {
                if (callbacks.prev) {
                    callbacks.prev();
                }
            });
    }

    function _createListCallbacks(feature, index, template, getData, features, close) {
        var prev;
        if (index > 0) {
            prev = function (e) {
                if (e) {
                    e.preventDefault();
                }
                index = index - 1;
                feature = features[index];
                var callbacks = _createListCallbacks(feature, index, template, getData, features, close);
                showFeature(feature, template, getData, callbacks, index, features.length);
            };
        }
        var next;
        if (index < features.length - 1) {
            next = function (e) {
                if (e) {
                    e.preventDefault();
                }
                index = index + 1;
                feature = features[index];
                var callbacks = _createListCallbacks(feature, index, template, getData, features, close);
                showFeature(feature, template, getData, callbacks, index, features.length);
            };
        }

        if (!close) {
            close = function () {
                showFeatures(features, template, getData, options.noListThreshold, true);
            };
        }

        return {
            prev: prev,
            close: close,
            next: next
        };
    }

    function _createListElement(feature, index, template, getData, features) {
        var marker;
        if (feature.properties.thumbnail) {
            marker = options.thumbnailTemplate({
                thumbnail: KR.Util.getImageCache(feature.properties.thumbnail, 80, 60),
                thumbnail2x: KR.Util.getImageCache(feature.properties.thumbnail, 60, 120),
                color: KR.Style.colorForFeature(feature, true)
            });
        } else {
            marker = options.markerTemplate({
                icon: '',
                color: KR.Style.colorForFeature(feature)
            });
        }

        var li = $(options.listElementTemplate({
            title: feature.properties.title,
            marker: marker
        }));

        li.on('click', function (e) {
            e.preventDefault();
            var callbacks = _createListCallbacks(feature, index, template, getData, features);
            showFeature(feature, template, getData, callbacks, index, features.length);
            return false;
        });
        return li;
    }

    function distanceAndBearing(feature) {
        if (map && map.userPosition) {
            var pos = turf.point([
                map.userPosition.lng,
                map.userPosition.lat
            ]);
            var distBear =  KR.Util.distanceAndBearing(pos, feature);
            var dist = distBear.distance;
            if (dist < 1000) {
                dist = KR.Util.round(dist, 0) + ' Meter';
            } else {
                dist = KR.Util.round(dist / 1000, 2) + ' Kilometer';
            }
            return {
                dist: dist,
                rot: distBear.bearing - 45 //-45 because of rotation of fa-location-arrow
            };
        }
    }

    function showFeature(feature, template, getData, callbacks, index, numFeatures) {
        var distBear = distanceAndBearing(feature);
        if (getData) {
            var content = '';
            if (feature.properties.title) {
                content += '<h3>' + feature.properties.title + '</h3>';
            }
            content += '<i class="fa fa-spinner fa-pulse fa-3x"></i>';
            _setContent(content);
            getData(feature, function (newFeature) {
                newFeature.properties = _.extend(feature.properties, newFeature.properties);
                showFeature(newFeature, template, null, callbacks, index, numFeatures);
            });
            return;
        }

        template = template || feature.template || KR.Util.templateForDataset(feature.properties.dataset) || defaultTemplate;

        var img = feature.properties.images;
        if (_.isArray(img)) {
            img = img[0];
        }

        if (!feature.properties.images) {
            feature.properties.images = null;
        }

        if (feature.properties.allProps && feature.properties.allProps.europeana_rights) {
            feature.properties.license = feature.properties.allProps.europeana_rights[0];
        } else {
            feature.properties.license = null;
        }

        var color = KR.Style.colorForFeature(feature, true, true);
        var content = '<span class="providertext" style="color:' + color + ';">' + feature.properties.provider + '</span>';

        feature.properties = _.extend(feature.properties, {
            distanceBearing: distBear
        });

        content += template(_.extend({image: null}, feature.properties));

        if (options.footerTemplate && feature.properties.link) {
            content += options.footerTemplate(feature.properties);
        }

        _setContent(content);
        _setupSwipe(callbacks);

        wrapper.find('.prev-next-arrows').remove();

        top.html('');
        if (callbacks) {
            var list = $('<a class="pull-left list-btn"><i class="fa fa-bars"></i></a>');
            top.append(list);
            list.click(callbacks.close);
            var idx = index + 1;
            top.append($('<div class="top-text pull-left"><b>' + idx + '</b> av ' + numFeatures + '</div>'));

            var prev = $('<a class="prev-next-arrows prev circle"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span></a>');
            wrapper.append(prev);
            if (callbacks.prev) {
                prev.click(callbacks.prev).addClass('active');
            }


            var next = $('<a class="prev-next-arrows next circle"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></a>');
            wrapper.append(next);
            if (callbacks.next) {
                next.click(callbacks.next).addClass('active');
            }
        }

        if (typeof audiojs !== 'undefined') {
            audiojs.createAll();
        }
        element.scrollTop(0);
    }

    function showFeatures(features, template, getData, noListThreshold, forceList) {
        noListThreshold = (noListThreshold === undefined) ? options.noListThreshold : noListThreshold;
        var shouldSkipList = (features.length <= noListThreshold);
        if (shouldSkipList && forceList !== true) {
            var feature = features[0];
            element.html('');
            var callbacks = _createListCallbacks(feature, 0, template, getData, features);
            this.showFeature(feature, template, getData, callbacks, 0, features.length);
            return;
        }

        var count = $('<span class="circle">' + features.length + '</span>');
        top.html(count);

        var grouped = _.chain(features)
            .groupBy(function (feature) {
                return feature.properties.provider;
            })
            .map(function (featuresInGroup, key) {
                var wrap = $('<div></div>');
                var list = $('<div class="list-group"></ul>');
                var elements = _.map(featuresInGroup, function (feature) {
                    var index = _.findIndex(features, function (a) {
                        return a === feature;
                    });
                    return _createListElement(feature, index, template, getData, features);
                }, this);

                list.append(elements);
                wrap.append('<h5 class="providertext">' + key + '</h5>');
                wrap.append(list);
                return wrap;
            }).value();

        element.html(grouped);
        element.scrollTop(0);
    }

    return {
        showFeature: showFeature,
        showFeatures: showFeatures,
        setMap: function (_map) {
            map = _map;
        }
    };
};
