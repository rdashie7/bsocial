const ApiError = require('../exceptions/api-error');

module.exports = function (err, req, res, next) {
    console.log('Error middleware!');
    console.log(err);

    if (err instanceof ApiError) {
        res
            .status(err.status)
            .json({
                message: err.message,
                details: err.details
            });
        return;
    }

    res
        .status(500)
        .json({
            message: 'Неизвестная ошибка сервера!'
        });
};