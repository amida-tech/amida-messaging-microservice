
module.exports = {
    up(queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.changeColumn('Users', 'username', {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        }).then(() => queryInterface.addColumn('Messages', 'tags', Sequelize.ARRAY(Sequelize.STRING)));
    },
    down(queryInterface, Sequelize) {
        return queryInterface.changeColumn('Users', 'username', {
            type: Sequelize.STRING,
            allowNull: false,
            unique: false,
        }).then(() => queryInterface.removeColumn('Messages', 'tags'));
    },
};
