var config = require('./config'),
    moment = require('moment'),
    log4js = require('log4js');

log4js.configure(config.log, {});

module.exports = log4js.getLogger('debug');
module.exports.logAccess = log4js.connectLogger(log4js.getLogger('access'), {
    level: 'auto'
});

module.exports.dateformat = function(obj, format) {
    format = format || 'YYYY-MM-DD HH:mm';
    return moment(obj).format(format);
};
