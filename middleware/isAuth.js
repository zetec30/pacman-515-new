module.exports = {
    isAuth: (req, res, next) => {
        try {
            if (req.isAuthenticated()) {
                return next();
            } else {
                res.redirect('/');
            }
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error')
        }
    }
}