'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Ips', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      ip: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Ips');
  }
};