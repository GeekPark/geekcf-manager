module.exports = {
    log: {
        appenders: [ { 
            layout: {
                type: "pattern",
                pattern: "%[%d %-5p %-6c(%x{pid})%] - %m",
                tokens: {
                    pid: process.pid 
                }
            },
            type: "console"
        }, {
            layout: {
                type: "pattern",
                pattern: "%d %-5p (%x{pid}) - %m",
                tokens: {
                    pid: process.pid 
                }
            },
            type: "file",
            filename: "/var/log/geekcf/manager/debug.log", 
            category: "debug" 
        }, { 
            layout: {
                type: "pattern",
                pattern: "%d %-5p (%x{pid}) - %m",
                tokens: {
                    pid: process.pid 
                }
            },
            type: "dateFile", 
            filename: "/var/log/geekcf/manager/access",
            category: "access",
            pattern: "_yyyy-MM-dd.log",
            alwaysIncludePattern: true
        } ]
    }
}
