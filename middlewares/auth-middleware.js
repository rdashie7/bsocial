const jwt = require('jsonwebtoken');
const ApiError = require("../exceptions/api-error");

module.exports = function (req, res, next) {
    try {
        if (!req.headers.authorization) {
            throw ApiError.UnauthorizedError();
        }

        let accessToken = req.headers.authorization.split(' ')[1];
        if (!accessToken) {
            throw ApiError.UnauthorizedError();
        }

        try {
            let payload = jwt.verify(accessToken, process.env.JWT_SECRET_ACCESS);
            req.userData = payload;
            next();
        } catch {
            throw ApiError.UnauthorizedError();
        }
    } catch (e) {
        next(e);
    }
};