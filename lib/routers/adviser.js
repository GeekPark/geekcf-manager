var router = require('express').Router(),
    util = require('../utils'),
    multipart = require('connect-multiparty'),
    base = require('../base');

router.route('/')
    .post(multipart(), (req, res, next) => {
        var picture = req.files.picture;
        if (picture.headers.filename) {
            base.file.mkfile(picture)
                .then(dataPath => {
                    var data = req.body;
                    data.picture = dataPath
                    return data
                })
                .then(data => {
                    return base.Adviser.create(data)
                })
                .then(adviser => {
                    console.log(adviser);
                    res.redirect(`/adviser/${adviser._id}`);
                })
                .then(undefined,err => {
                    console.error(err);
                });
        } else {
            var data = req.body;
            base.Adviser
                .create(data)
                .then(adviser => {
                    console.log(adviser);
                    res.redirect(`/adviser/${adviser._id}`);
                })
                .then(undefined, err => {
                    console.log(err);
                    res.redirect('/adviser')
                });
        }
        // var data = req.body;
        // base.Adviser
        //     .create(data)
        //     .then(adviser => {
        //         console.log(adviser);
        //         res.redirect(`/adviser/${adviser._id}`);
        //     })
        //     .then(undefined, err => {
        //         console.log(err);
        //         res.redirect('/adviser')
        //     });
    })
    .get((req, res, next) => {
        var type = req.query.t;
        var find = {}
        if (type) {
            find.adviserState = parseInt(type,0)
        }
        console.log(find)
        base.Adviser
            .find(find)
            .sort({
                added: -1
            })
            .then(list => {
                res.render('adviser', {
                    list
                });
            });
    });


router.route('/:id')
    .delete((req, res, next) => {
        res.send(0);
    })
    .post(multipart(),(req, res, next) => {
        var data = req.body;
        base.Adviser
            .findOne({
                _id: req.params.id
            })
            .then(adviser => {
                var picture = req.files.picture;
                if (picture.headers.filename) {
                    base.file.mkfile(picture)
                        .then(dataPath => {
                            var data = req.body;
                            data.picture = dataPath
                            return data
                        })
                        .then(data => {
                            return adviser.update(data)
                        })
                        .then(result => {
                            console.log(result);
                            res.redirect(`/adviser/${adviser._id}`);
                        })
                        .then(undefined, err => {
                            console.log(err);
                            res.redirect('/adviser')
                        })
                }
                else {
                    adviser.update(data)
                        .then(result => {
                            console.log(result);
                            res.redirect(`/adviser/${adviser._id}`);
                        })
                        .then(undefined, err => {
                            console.log(err);
                            res.redirect('/adviser')
                        })
                }
            })
            .then(undefined, err => {
                console.log(err);
                res.redirect('/adviser')
            })
    })
    .get((req, res, next) => {
        base.Adviser
            .findOne({
                _id: req.params.id
            })
            .then(adviser => {
                if (req.query.changeType) {
                    adviser.adviserState = req.query.changeType;
                    adviser.save()
                    res.redirect("/adviser")
                }
                else {
                    res.render('adviser-detail', {
                        adviser,
                        uploadAPI: base.config.uploadAPI,
                        plug: base.config.plug
                    });
                }
            })
            .then(undefined, err => {
                console.error(err);
                res.render('adviser-detail', {
                    adviser: {},
                    uploadAPI: base.config.uploadAPI,
                    plug: base.config.plug
                });
            })
    });

module.exports = router;
