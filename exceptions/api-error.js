module.exports = class ApiError extends Error {
    status;
    details;

    constructor(message, status, details = {}) {
        super(message);
        this.status = status;
        this.details = details;
    }

    static UnauthorizedError() {
        return new ApiError('Пользователь не авторизован!', 401);
    }

    static BadRequest(message, details = {}) {
        return new ApiError(message, 400, details);
    }

    static InternalServerError(message = 'Неизвестная ошибка сервера!', details = {}) {
        return new ApiError(message, 500, details);
    }
}