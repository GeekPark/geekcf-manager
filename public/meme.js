var openKey = 'openmeme', closeKey = 'close', keys = [];
$('body').on('keypress', function(evt) {
    fillKeys(evt.keyCode);
});

function fillKeys(code) {
    keys.push(String.fromCharCode(code));
    if(checkKey(openKey)) {
        $.cookie('open', true, {path: '/'});
        location.href = location.href;
    }
    if(checkKey(closeKey)) {
        $.cookie('open', false, {path: '/'});
        location.href = location.href;
    }
}

function checkKey(key) {
    if(key === keys.slice(key.length * -1).join('')) {
        keys = [];
        return true;
    }
    return false;
}
