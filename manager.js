var path = require('path'),
    express = require('express'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    config = require('./lib/config'),
    util = require('./lib/utils'),
    base = require('./lib/base'),
    ruleChecker = require('./lib/rule-checker'),
    rule = require('./lib/urlRule'),
    app = express();

base.mongo.connect(base.config.mongo, function (err) {
    if (err) {
        console.error(err);
        process.exit(0);
    } else {
        start();
    }
});

function start() {
    app.set('views', path.join(__dirname, 'lib/views'));
    app.set('view engine', 'jade');
    app.use(compression({
        threshold: 512
    }));
    app.use(util.logAccess);
    app.use(cookieParser(base.config.secret));
    app.use(bodyParser.urlencoded({
        limit: '10mb',
        extended: false
    }));
    app.use(bodyParser.json({
        limit: '10mb'
    }));
    app.use(express.static('public', {
        index: false,
        maxAge: '7 days'
    }));
    // checkin
    app.use(function (req, res, next) {
        var token = req.signedCookies.t;
        var sum = 0;
        base.Admin.find()
            .count()
            .then(function (count) {
                sum = count;
                if (count === 0) {
                    app.locals = {
                        domain: req.headers.host.replace(
                            'manager.',
                            ''),
                        admin: {
                            'role': 1
                        },
                        format: util.dateformat
                    };
                    throw 'not has admins';
                } else {
                    return base.token.decoded(token);
                }
            })
            .then(function (user) {
                var ckuid = user && user.hasOwnProperty('_id') ?
                    user._id : user;
                app.locals = {
                    domain: req.headers.host.replace('manager.',
                        ''),
                    isopen: base.isTrue(req.cookies.open),
                    format: util.dateformat,
                    token: token,
                    ckuid: ckuid
                };

                global.uid = ckuid;
                return base.Admin.get(ckuid);
            })
            .then(function (admin) {
                if (admin) {
                    app.locals.admin = admin;
                    next();
                } else {
                    res.redirect('http://' + app.locals
                        .domain);
                }
            })
            .then(undefined, function (err) {
                console.error(err);
                if (sum === 0) {
                    next();
                } else {
                    res.redirect('http://' + app.locals
                        .domain);
                }
            });
    });

    app.use(ruleChecker(rule));

    app.use('/applying',    require('./lib/routers/applyingData'));
    app.use('/adviser',     require('./lib/routers/adviser'));
    app.use('/data',        require('./lib/routers/data'));
    app.use('/invite',      require('./lib/routers/invite'));
    app.use('/mer',         require('./lib/routers/mer'));
    app.use('/mysterious',  require('./lib/routers/mysteriousImage'));
    app.use('/order',       require('./lib/routers/order'));
    app.use('/project',     require('./lib/routers/project'));
    app.use('/text',        require('./lib/routers/staticText'));
    app.use('/tool',        require('./lib/routers/tool'));
    app.use('/user',        require('./lib/routers/user'));
    app.use('/*',           require('./lib/routers/home'));


    util.error('=========================================');
    util.error('|-.-|  ~ GEEK CF Manager Service ~  |-.-|');
    util.error('=========================================');
    for (var i = 0, l = config.ports.length; i < l; i++) {
        app.listen(config.ports[i]);
    }
}
