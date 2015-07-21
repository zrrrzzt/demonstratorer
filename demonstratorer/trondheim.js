(function () {
    'use strict';

    //The datasets in use
    var datasets = [
        {
            thumbnails: true,
            name: 'Digitalt fortalt',
            dataset: {dataset: 'difo', api: 'norvegiana'},
            template: _.template($('#digitalt_fortalt_template').html())
        },
        {
            name: 'Kulturminner',
            dataset_name_override: 'Kulturminnesok',
            dataset: {
                api: 'norvegiana',
                dataset: 'Kulturminnesok',
                query: '-delving_title:Fangstlokalitet'
            },
            template: _.template($('#kulturminne_template').html()),
            smallMarker: true
        },
        {
            name: 'Wikipedia',
            provider: 'Wikipedia',
            dataset: {
                api: 'wikipedia'
            },
            template: _.template($('#wikipedia_template').html()),
            style: {template: true},
            minZoom: 13
        },
        {
            name: 'Trondheim byarkiv',
            dataset_name_override: 'Trondheim byarkiv',
            provider: 'Trondheim byarkiv',
            dataset:  {
                api: 'flickr',
                user_id: 'trondheim_byarkiv'
            },
            template: _.template($('#flickr_template').html()),
            style: {fillcolor: '#D252B9'}
        },
        {
            name: 'Riksantikvaren',
            provider: 'Riksantikvaren',
            dataset: {
                api: 'kulturminnedataSparql',
                kommune: '1601'
            },
            template: _.template($('#ra_sparql_template').html()),
            bbox: false,
            style: {fillcolor: '#728224'}
        },
        {
            name: 'MUSIT',
            dataset: {
                api: 'norvegiana',
                dataset: 'MUSIT'
            },
            template: _.template($('#musit_template').html()),
            minZoom: 12,
            style: {thumbnail: true}
        },
        {
            name: 'DiMu',
            dataset: {
                api: 'norvegiana',
                dataset: 'DiMu'
            },
            template: _.template($('#digitalt_museum_template').html()),
            minZoom: 12,
            style: {thumbnail: true}
        }
    ];

    //set up an instance of the Norvegiana API
    var api = new KR.API({
        cartodb: {
            apikey: 'e6b96c1e6a71b8b2c6f8dbb611c08da5842f5ff5',
            user: 'knreise'
        },
        flickr: {
            apikey: 'ab1f664476dabf83a289735f97a6d56c'
        }
    });


    var bbox = '10.338650,63.408816,10.555458,63.462016';
    KR.setupMap(api, datasets, {
        bbox: bbox,
        title: 'Trondheim',
        description: $('#description_template').html()
    });
}());