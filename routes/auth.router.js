const {Router} = require('express');
const db = require('../models');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const expressDevice = require('express-device');
const geoip = require('geoip-lite');
const {detect} = require('detect-browser');
const nodemailer = require("nodemailer");
const ApiError = require("../exceptions/api-error");


const AuthApiRouter = Router();

AuthApiRouter.post(
    '/register',
    check('firstname')
        .isLength({min: 3})
        .withMessage('Имя должно иметь минимум 3 символа'),
    check('secondname')
        .isLength({min: 3})
        .withMessage('Фамилия должна иметь минимум 3 символа'),
    check('email')
        .isEmail()
        .withMessage('Неверный формат почты'),
    check('password')
        .isLength({min: 8, max: 20})
        .withMessage('Пароль должен быть от 8 до 20 символов'),
    check('confirm-password')
        .custom((value, {req}) => value === req.body.password)
        .withMessage('Пароли должны совпадать'),
    async function (req, res, next) {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.BadRequest('Неверные данные при валидации!', {
                    type: 'validation-error',
                    fields: errors.array()
                });
            }

            let existingUser = await db.User.findOne({
                where: {
                    email: req.body.email
                }
            });
            if (existingUser) {
                throw ApiError.BadRequest('Пользователь с такой почтой уже существует!', {
                    type: 'existing-email'
                });
            }


            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                {browser, os} = req.useragent,
                geo = geoip.lookup(ip),
                country = geo?.country,
                city = geo?.city;
            let user, payload, secret, accessToken, refreshToken;

            const t = await db.sequelize.transaction();
            try {
                user = await db.User.create({
                    firstName: req.body.firstname,
                    lastName: req.body.secondname,
                    photo: 'default_user.png',
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)),
                    isConfirmed: false,
                    confirmationCode: 100000 + Math.floor(Math.random() * 900000)
                }, {transaction: t});

                await db.Connection.create({
                    user_id: user.id,
                    ip,
                    ip_status: 1, // айпи не подтврежден или новый вход (0 || null)
                    os,
                    browser,
                    country,
                    city,
                    last_connect: (new Date()).toUTCString()
                }, {transaction: t});

                await t.commit();
            } catch (e) {
                await t.rollback();
                throw ApiError.InternalServerError(e.message);
            }

            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: 'bsocial771@gmail.com',
                    pass: 'TempPass01',
                },
            });
            try {
                let info = await transporter.sendMail({
                    from: '"BSocial" <bsocial771@gmail.com>',
                    to: `bsocial771@gmail.com, ${req.body.email}`,
                    subject: "BSocial Account Confirmation",
                    html: `
                        <b>Перейдите по ссылке, чтобы подтвердить почту:</b>
                        <a href="${process.env.CLIENT_URL}/email/confirm?code=${user.confirmationCode}&dirus=${user.id}">
                            ${process.env.CLIENT_URL}/email/confirm?code=${user.confirmationCode}&dirus=${user.id}
                        </a>
                    `
                });
            } catch (e) {
                console.log(e);
            }


            res
                .cookie('refreshToken', refreshToken, {
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    httpOnly: true
                })
                .json({
                    message: 'Пользователь успешно создан!',
                    details: {
                        userId: user.id
                    }
                });
        } catch (e) {
            next(e);
        }
    }
);

AuthApiRouter.get('/confirm', async function (req, res, next) {
    try {
        console.log('confirm func')

        let
            confirmationCode = req.query.code,
            id = req.query.dirus;

        let existedUser = await db.User.findOne({
            where: {
                id,
                confirmationCode
            }
        });

        if (!existedUser) {
            throw ApiError.BadRequest('Ошибка на сервере!');
        }

        if (existedUser.isConfirmed) {
            throw ApiError.BadRequest('Данная почта уже подтверждена!');
        }

        await existedUser.update({
            isConfirmed: true
        });

        res.json({
            message: 'Почта успешно подтверждена!',
        })
    } catch (e) {
        next(e);
    }
});

AuthApiRouter.post(
    '/login',
    check('email')
        .notEmpty()
        .withMessage('Поле email должно быть заполнено'),
    check('password')
        .notEmpty()
        .withMessage('Поле password должно быть заполнено'),
    async function (req, res, next) {
        try {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.BadRequest('Неверные данные при валидации!', {
                    type: 'validation-error',
                    fields: errors.array()
                });
            }

            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                user = await db.User.findOne({
                    attributes: [
                        'id', 'password',
                        [db.sequelize.literal(`(SELECT ip_status FROM connections WHERE connections.user_id=id AND ip='${ip}')`), 'ip_status']
                    ],
                    where: {
                        email: req.body.email
                    }
                }),
                {id, password, ip_status} = user.dataValues;

            if (!user || !bcrypt.compareSync(req.body.password, password)) {
                throw ApiError.BadRequest('Неверная почта или пароль!');
            }

            if (ip_status === 2) {
                throw ApiError.InternalServerError(); // айпи заблокирован (статус 2)
            }

            const
                payload = {userId: id},
                accessToken = jwt.sign(payload, process.env.JWT_SECRET_ACCESS, {expiresIn: '15m'}),
                refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {expiresIn: '30d'}),
                {browser, os} = req.useragent,
                geo = geoip.lookup(ip),
                country = geo?.country,
                city = geo?.city;


            const t = await db.sequelize.transaction();
            try {
                await db.Token.upsert({
                    user_id: id,
                    refreshToken
                }, {transaction: t});

                await db.Connection.upsert({
                    user_id: id,
                    ip,
                    ip_status: ip_status || 0, // айпи не подтврежден или новый вход (0 || null)
                    os,
                    browser,
                    country,
                    city,
                    last_connect: (new Date()).toUTCString()
                }, {transaction: t});

                await t.commit();
            } catch (error) {
                await t.rollback();
                throw ApiError.InternalServerError('Неизвестная ошибка сервера!');
            }

            res
                .cookie('refreshToken', refreshToken, {
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    httpOnly: true
                })
                .json({
                    message: 'Успешно залогинены!',
                    details: {
                        userId: id,
                        accessToken
                    }
                });

            if (!ip_status) {// айпи не подтврежден или новый вход (0 || null)
                let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'bsocial771@gmail.com',
                        pass: 'TempPass01',
                    },
                });

                try {
                    await transporter.sendMail({
                        from: '"BSocial" <bsocial771@gmail.com>',
                        to: `bsocial771@gmail.com, ${req.body.email}`,
                        subject: "BSocial, New Device Alert",
                        html: `
                            <b>В ваш аккаунт был произведён вход с нового устройства.</b>
                        `
                    });
                } catch (e) {
                    console.log(`Не удалось отправить письмо про вход с неизвестного устройства на почту ${req.body.email}!`);
                    console.log('Ошибка:', e);
                }
            }
        } catch (e) {
            next(e);
        }
    }
);

AuthApiRouter.get(
    '/logout',
    async function (req, res, next) {
        const {refreshToken} = req.cookies;
        if (refreshToken) {
            try {
                await db.Token.destroy({
                    where: {
                        refreshToken
                    }
                });
            } catch {
                console.log('Ошибка при при выполнении запроса...');
            }
        }

        res
            .clearCookie('refreshToken')
            .json({
                message: 'Успешно разлогинены!'
            });
    }
);

AuthApiRouter.get(
    '/refresh',
    async function (req, res, next) {
        try {
            let {refreshToken} = req.cookies;
            if (!refreshToken) {
                throw ApiError.UnauthorizedError();
            }


            let payload, refreshSecret = process.env.JWT_SECRET_REFRESH;
            try {
                payload = jwt.verify(refreshToken, refreshSecret);
            } catch (e) {
                console.log("token isn't valid");
                throw ApiError.UnauthorizedError();
            }


            let tokenRow = await db.Token.findOne({
                where: {
                    refreshToken
                }
            });

            if (!tokenRow) {
                throw ApiError.UnauthorizedError();
            }

            let accessSecret = process.env.JWT_SECRET_ACCESS,
                accessToken = jwt.sign({userId: payload.userId}, accessSecret, {expiresIn: '15m'});
            refreshToken = jwt.sign({userId: payload.userId}, refreshSecret, {expiresIn: '30d'});


            await tokenRow.update({
                refreshToken
            });


            res
                .cookie('refreshToken', refreshToken)
                .json({
                    message: 'Токены обновлены!',
                    details: {
                        userId: payload.userId,
                        accessToken,
                        refreshToken
                    }
                });
        } catch (e) {
            next(e);
        }
    }
);


AuthApiRouter.get(
    '/logout/error',
    async function (req, res) {
        res
            .status(401)
            .json({
                message: 'Ошибка 401!'
            });
    }
);


module.exports = AuthApiRouter;