'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Connections', {
      user_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      ip: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      ip_status: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      os: {
        type: Sequelize.STRING,
        allowNull: false
      },
      browser: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      last_connect: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Connections');
  }
};