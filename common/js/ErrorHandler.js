var KR = this.KR || {};
(function (ns) {
    'use strict';

    function parseError(error) {
        if (error.responseJSON) {
            if (error.responseJSON.error) {
                return error.responseJSON.error.join(', ');
            }
            if (error.responseJSON.status) {
                return error.responseJSON.status;
            }
        }
        if (error.error) {
            if (error.error.info) {
                return error.error.info;
            }
            return error.error;
        }
        return 'Unknown error';
    }

    ns.errorHandler = function (template) {

        var alert = $(template);
        alert.find('.close').on('click', function () {
            alert.find('.content').html('');
            alert.remove();
        });
        var templ = _.template('<div><strong><%= dataset %>:</Strong> <%= error %></div>');
        return function (error) {
            var message = templ({
                dataset: error.dataset,
                error: parseError(error.error)
            });
            if (alert.parent()) {
                alert.find('.content').append(message);
            } else {
                alert.find('.content').html(message);
            }
            $('body').append(alert);
        };
    };
}(KR));