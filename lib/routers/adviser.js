var router = require('express').Router(),
    util = require('../utils'),
    base = require('../base');

router.route('/')
.post((req, res, next) => {
    var data = req.body;
    base.Adviser
        .create(data)
        .then(adviser => {
            console.log(data);
            res.send(adviser);
        })
        .then(undefined, err => {
            res.send(err);
        });
})
.get((req, res, next) => {
    base.Adviser
        .find()
        .then(list => {
            res.render('adviser', { list });
        });
});

router.route('/:id')
.delete((req, res, next) => {
    res.send(0);
})
.post((req, res, next) => {
    var data = req.body;
    base.Adviser
        .findOne({_id: req.params.id})
        .then(adviser => {
            adviser
                .update(data)
                .then(result => {
                    console.log(result);
                    res.redirect(`/adviser/${adviser._id}`);
                })
                .then(undefined, err => {
                    console.log(err);
                    res.redirect('/adviser')
                })
        })
        .then(undefined, err => {
            console.log(err);
            res.redirect('/adviser')
        })
})
.get((req, res, next) => {
    console.log(req.params.id);
    base.Adviser
        .findOne({_id: req.params.id})
        .then(adviser => {
            res.render('adviser-detail', {
                adviser,
                uploadAPI: base.config.uploadAPI,
                plug: base.config.plug
            });
        })
        .then(undefined, err => {
            res.render('adviser-detail', {
                adviser: { },
                uploadAPI: base.config.uploadAPI,
                plug: base.config.plug
            });
        })
});

module.exports = router;
