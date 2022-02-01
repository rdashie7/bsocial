'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Connection extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }

    Connection.init({
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        ip: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        ip_status: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        os: {
            type: DataTypes.STRING,
            allowNull: false
        },
        browser: {
            type: DataTypes.STRING,
            allowNull: false
        },
        country: DataTypes.STRING,
        city: DataTypes.STRING,
        last_connect: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        sequelize,
        timestamps: false,
        modelName: 'Connection',
    });
    return Connection;
};