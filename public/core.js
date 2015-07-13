(function ($, win, undef) {
    var hostname = location.host.replace('manager.', '');
    (win.STool === undef) && (win.STool = {});
    STool.get = makeAjaxFunc('GET');
    STool.put = makeAjaxFunc('PUT');
    STool.post = makeAjaxFunc('POST');
    STool.delete = makeAjaxFunc('DELETE');

    STool.apiURL = 'http://api.' + hostname + '/v1/';
    STool.webURL = 'http://' + hostname + '/';

    $(function() {
        // short key
        $('body').on('keyup', function(evt) {
            if('input,textarea'.split(',').indexOf(evt.target.tagName.toLowerCase()) !== -1) {
                return;
            }
            switch(evt.keyCode) {
                case 191: // /
                    $('input:text')[0].focus();
                    break;
                default:
                    // nothing...
                    break;
            }
        });
    });

    function makeAjaxFunc(type) {
        return function(url, data, callback) {
            $.ajax(STool.apiURL +  url, {
                data: typeof data === 'function' ? null : data,
                dataType: 'jsonp',
                type: type,
                success: callback || data
            });
        };
    }
})(jQuery, window);
