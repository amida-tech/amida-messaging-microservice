
module.exports = {
    up(queryInterface, Sequelize) {
        return queryInterface.createTable('Messages', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            /**
             * Each sent message is replicated for every recipient. This allows
             * users to maintain their own copies of a message for tracking
             * readAt times and soft deletion. It also allows for per-user
             * message threading.
             */
            owner: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            originalMessageId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            parentMessageId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            /* eslint-disable new-cap */
            to: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: false,
            },
            from: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            subject: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },

            readAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            isDeleted: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            isArchived: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
            ThreadId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Threads',
                    key: 'id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            LastMessageId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Threads',
                    key: 'id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            SenderId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
        });
    },
    down(queryInterface, Sequelize) { // eslint-disable-line no-unused-vars
        return true;
    },
    // down: (queryInterface, Sequelize) => queryInterface.dropTable('Messages'),
};
