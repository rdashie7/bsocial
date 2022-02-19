const {Router} = require("express");
const fs = require("fs");
const db = require("../models");
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ApiError = require("../exceptions/api-error");
const path = require("path");
const authMiddleware = require('../middlewares/auth-middleware');
const axios = require("axios");


const UserApiRouter = Router();

const STORAGE_URL = process.env.STORAGE_URL;

UserApiRouter.get('/', async function (req, res, next) {
    console.log('user req 1')
    try {
        const
            accessToken = req.headers.authorization.split(' ')[1],
            accessSecret = process.env.JWT_SECRET_ACCESS;
        let payload;

        try {
            payload = jwt.verify(accessToken, accessSecret);
        } catch {
            console.log('access token expired');
            throw ApiError.UnauthorizedError();
        }

        let userData = await db.User.findOne({
            where: {
                id: payload.userId
            }
        });

        let userPosts = await db.Post.findAll({
            limit: 10,
            order: [
                ['createdAt', 'DESC']
            ]
        });

        res
            .json({
                firstname: userData.firstName,
                lastname: userData.lastName,
                photo: userData.photo,
                email: userData.email,
                posts: userPosts
            })
    } catch (e) {
        next(e);
    }
});

UserApiRouter.post('/avatar', authMiddleware, async function (req, res, next) {
    try {
        let {mainImg, croppedImg} = req.body,
            mainImgBuffer = Buffer.from(mainImg.dataURL.split(",")[1], 'base64'),
            croppedImgBuffer = Buffer.from(croppedImg.dataURL.split(",")[1], 'base64'),
            mainImgFilename = (bcrypt.hashSync(mainImg.filename, bcrypt.genSaltSync(10)) + '.' + mainImg.filename.split('.').pop()).replace(/[\/\\]/g, ""),
            croppedImgFilename = (bcrypt.hashSync(croppedImg.filename, bcrypt.genSaltSync(10)) + '.' + croppedImg.filename.split('.').pop()).replace(/[\/\\]/g, "");

        await axios.post(STORAGE_URL + '/api/img', {
            images: [
                {
                    filename: mainImgFilename,
                    buffer: mainImgBuffer
                },
                {
                    filename: croppedImgFilename,
                    buffer: croppedImgBuffer
                },
            ]
        });

        const t = await db.sequelize.transaction();

        try {
            const user = await db.User.findOne({
                where: {
                    id: req.userData.userId
                }
            }, {transaction: t});

            await user.update({
                photo: croppedImgFilename,
            }, {transaction: t});

            await db.Image.create({
                path: mainImgFilename,
                user_id: req.userData.userId
            }, {transaction: t});

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw ApiError.InternalServerError('Неизвестная ошибка сервера!');
        }

        res
            .json({
                message: 'Avatar uploaded',
                details: {
                    photo: croppedImgFilename
                }
            })
    } catch (e) {
        next(e);
    }
});

UserApiRouter.post(
    '/edit',
    authMiddleware,
    check('firstname')
        .isLength({min: 3})
        .withMessage('Имя должно иметь минимум 3 символа'),
    check('lastname')
        .isLength({min: 3})
        .withMessage('Фамилия должна иметь минимум 3 символа'),
    async function (req, res, next) {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.BadRequest('Неверные данные при валидации!', {
                    type: 'validation-error',
                    fields: errors.array()
                });
            }

            let {firstname, lastname, birthday, city} = req.body;

            await db.User.update({
                firstName: firstname,
                lastName: lastname,
                birthday,
                city
            }, {
                where: {
                    id: req.userData.userId
                }
            });

            res.json({
                message: 'Данные успешно сохранены!'
            });
        } catch (e) {
            next(e);
        }
    }
);

UserApiRouter.post(
    '/change_password',
    authMiddleware,
    check('old-password')
        .notEmpty()
        .withMessage('Поле должно быть заполнено!'),
    check('new-password')
        .isLength({min: 8})
        .withMessage('Новый пароль должен быть минимум 8 символов!'),
    async function (req, res, next) {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.BadRequest('Неверные данные при валидации!', {
                    type: 'validation-error',
                    fields: errors.array()
                });
            }

            const {'old-password': oldPassword, 'new-password': newPassword} = req.body;

            const user = await db.User.findOne({
                where: {
                    id: req.userData.userId
                }
            });

            if (!user) {
                throw ApiError.InternalServerError('Неизвестная ошибка сервера!'); // пользователя нету в базе данных
            }

            if (!bcrypt.compareSync(oldPassword, user.password)) {
                throw ApiError.BadRequest('Неверный пароль!');
            }

            await user.update({
                password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10))
            });

            res.json({
                message: 'Пароль успешно изменен!'
            });
        } catch (e) {
            next(e);
        }
    }
);


UserApiRouter.get('/data',
    authMiddleware,
    async function (req, res, next) {
        try {
            let userData = await db.User.findOne({
                where: {
                    id: req.userData.userId
                }
            });

            res.json({
                message: 'Данные успешно отправлены!',
                details: {
                    firstname: userData.firstName,
                    lastname: userData.lastName,
                    birthday: userData.birthday,
                    city: userData.city,
                }
            })
        } catch (e) {
            next(e);
        }
    }
);

UserApiRouter.get('/connections',
    authMiddleware,
    async function (req, res, next) {
        try {
            let connections = await db.Connection.findAll({
                attributes: [
                    'ip', 'ip_status', 'os', 'browser', 'country', 'city', 'last_connect'
                ],
                where: {
                    user_id: req.userData.userId
                }
            });

            console.log(connections)

            res.json({
                message: 'Подключения успешно отправлены!',
                details: {
                    connections
                }
            });
        } catch (e) {
            next(e);
        }
    }
);

UserApiRouter.post('/connections/allow',
    authMiddleware,
    async function (req, res, next) {
        try {
            const {ip} = req.body;

            await db.Connection.update({
                ip_status: 1
            }, {
                where: {
                    user_id: req.userData.userId,
                    ip
                }
            });

            res.json({
                message: 'IP адрес разрешен!'
            });
        } catch (e) {
            next(e);
        }
    }
);

UserApiRouter.post('/connections/block',
    authMiddleware,
    async function (req, res, next) {
        try {
            const {ip} = req.body;

            await db.Connection.update({
                ip_status: 2
            }, {
                where: {
                    user_id: req.userData.userId,
                    ip
                }
            });

            res.json({
                message: 'IP адрес заблокирован!'
            });
        } catch (e) {
            next(e);
        }
    }
);


UserApiRouter.get('/temp', authMiddleware, function (req, res) {
    console.log('temp route');
    res.json({
        message: 'temp route success'
    });
});

module.exports = UserApiRouter;