var jade         = require('jade'),
    path         = require('path'),
    express      = require('express'),
    compression  = require('compression'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    config       = require('./lib/config'),
    util         = require('./lib/utils'),
    base         = require('./lib/base'),
    app          = express();

base.mongo.connect(base.config.mongo, function(err) {
    if(err) {
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

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    app.use(express.static('public', {
        index: false,
        maxAge: '7 days'
    }));

    // checkin
    app.use(function(req, res, next) {
        var token = req.signedCookies.t,
            admin = JSON.parse(base.file.read(base.config.confPath + 'admin.json') || '[]');

        base.token.decoded(token, function(err, user) {
            app.locals = {
                domain: req.headers.host.replace('manager.', ''),
                isopen: base.isTrue(req.cookies['open']),
                format: util.dateformat,
                token: token,
                ckuid: user.hasOwnProperty('_id') ? user._id : user;
            };

            global.uid = ckuid;

            if(ckuid && (admin.length === 0 || admin.indexOf(ckuid) !== -1)) {
                next();
            } else {
                res.redirect('http://' + app.locals.domain);
            }
        })
    });

    app.use('/project', require('./lib/routers/project'));
    app.use('/user', require('./lib/routers/user'));
    app.use('/tool', require('./lib/routers/tool'));
    app.use('/order',require('./lib/routers/order'));
    app.use('/invite',require('./lib/routers/invite'));
    app.use('/*', require('./lib/routers/home'));

    util.error('=========================================');
    util.error('|-.-|  ~ GEEK CF Manager Service ~  |-.-|');
    util.error('=========================================');

    for(var i=0, l=config.ports.length; i<l; i++) {
        app.listen(config.ports[i]);
    }
}
