(function () {
    'use strict';

    var api = new KR.API({
        cartodb: {
            apikey: 'e6b96c1e6a71b8b2c6f8dbb611c08da5842f5ff5',
            user: 'knreise'
        }
    });


    var datasets = [
            {
            name: 'Digitalt fortalt',
            dataset: {dataset: 'difo', api: 'norvegiana'},
            cluster: true,
            template: _.template($('#digitalt_fortalt_template').html()),
            noListThreshold: Infinity
        }
    ];


    var loveTrail = {
        api: 'cartodb',
        query: 'SELECT ST_AsGeoJSON(the_geom) as geom FROM kjaerlighetsstien_line'
    }

    function getLine (callback) {
        api.getData(loveTrail, function (geoJson)  {
            callback(geoJson);
        });
    }

    var options = {
        line: getLine,
        title: title,
        description: $('#description_template').html()
    };


    KR.setupMap(api, datasets, options, false);
}());
