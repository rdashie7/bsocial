'use strict';

const
    bcrypt = require('bcrypt'),
    salt = bcrypt.genSaltSync(10);

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add seed commands here.
         *
         * Example:
         * await queryInterface.bulkInsert('People', [{
         *   name: 'John Doe',
         *   isBetaMember: false
         * }], {});
         */

        return queryInterface.bulkInsert('Users', [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'example@example.com',
                password: bcrypt.hashSync('123456789', salt),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Ann',
                lastName: 'Does',
                email: 'ann@example.com',
                password: bcrypt.hashSync('345276434', salt),
                createdAt: new Date(),
                updatedAt: new Date()
            },
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */

        return queryInterface.bulkDelete('Users', null, {});
    }
};
