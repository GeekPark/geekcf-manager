"use strict";
var router = require('express').Router(),
    base = require('../base');
router.route('/').get(function (req, res, next) {
    base.Log.aggregate(
            [
                {
                    $group: {
                        _id: '$user',
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                }
            ]
        )
        .exec(function (err, logs) {
            res.render('data', {
                users: logs.length
            });
        });
});


router.route('/growthStatistics').get(function (req, res, next) {
    let date = new Date();
    let endDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23,
        59, 59));
    let startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate);
        endDate = new Date(req.query.endDate);
        endDate = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(),
            23, 59, 59));
    }
    let sql = [
        {
            $match: {
                added: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $project: {
                day: {
                    $dayOfMonth: '$added'
                },
                month: {
                    $month: '$added'
                },
                year: {
                    $year: '$added'
                }
            }
        },
        {
            $project: {
                day: {
                    '$cond': [
                        {
                            '$lte': ['$day', 9]
                        },
                        {
                            '$concat': [
                                    '0', {
                                    '$substr': ['$day', 0, 2]
                                    }
                                ]
                        },
                        {
                            '$substr': ['$day', 0, 2]
                        }
                    ]
                },
                month: {
                    '$cond': [
                        {
                            '$lte': ['$month', 9]
                        },
                        {
                            '$concat': [
                                    '0',
                                {
                                    '$substr': ['$month', 0, 2]
                                }
                            ]
                        },
                        {
                            '$substr': ['$month', 0, 2]
                        }
                    ]
                },
                year: {
                    $substr: ['$year', 0, 4]
                }
            }
        },
        {
            $project: {
                time: {
                    $concat: ['$year', '-', '$month', '-', '$day']
                }
            }
        },
        {
            $group: {
                '_id': '$time',
                'count': {
                    $sum: 1
                },
            }
        },
        {
            $sort: {
                '_id': 1
            }
        }
    ];
    base.User.aggregate(sql, function (err, result) {
        let countData = [];
        let xAxis = [];
        let map = {};
        let tempDate = startDate;
        let index = 0;
        let investorData = [];
        while (tempDate <= endDate) {
            let dateStr = tempDate.getFullYear() + '-' + base.p(tempDate.getMonth() +
                1) + '-' + base.p(tempDate.getDate());
            xAxis.push(dateStr);
            countData.push(0);
            investorData.push(0);
            map[dateStr] = index;
            index += 1;
            tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
        }
        for (let i = 0; i < result.length; i++) {
            let item = result[i];
            if (map[item._id] !== undefined) {
                countData[map[item._id]] = item.count;
            }
        }
        sql[0] = {
            $match: {
                applyInvestor: true,
                added: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        };
        base.User.aggregate(sql, function (err, result) {
            for (let i = 0; i < result.length; i++) {
                let item = result[i];
                if (map[item._id] !== undefined) {
                    investorData[map[item._id]] = item.count;
                }
            }
            res.render('data-growth', {
                startDate: startDate,
                endDate: endDate,
                countData: JSON.stringify(countData),
                investorData: JSON.stringify(investorData),
                xAxis: JSON.stringify(xAxis)
            });
        });
    });
});

module.exports = router;
