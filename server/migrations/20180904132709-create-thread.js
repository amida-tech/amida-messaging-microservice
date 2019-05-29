
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('Threads', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            topic: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            lastMessageId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            lastMessageSent: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            logUserId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            /* eslint-disable new-cap */
            tags: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()'),
            },
        });
    },
    down() {
        return true;
    },
    //down: (queryInterface, Sequelize) => queryInterface.dropTable('Threads'),
};
