'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'birthday', Sequelize.DATEONLY);
        await queryInterface.addColumn('users', 'city', {
            type: Sequelize.STRING,
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'birthday');
        await queryInterface.removeColumn('users', 'city');
    }
};
