'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const winston = require("winston");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};


const
    LOGS_DIR = 'logs/',
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: {service: 'user-service'},
        transports: [
            new winston.transports.File({
                filename: path.resolve(__dirname, '../', LOGS_DIR, 'error.log'),
                level: 'error'
            }),
            new winston.transports.File({filename: path.resolve(__dirname, '../', LOGS_DIR, 'combined.log')}),
        ],
    });

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], {...config});
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
        ...config,
        // logging: (...msg) => logger.info(msg)
        logging: false
    });
}

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
