
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
        });
    },
    down(queryInterface) {
        return queryInterface.removeConstraint('Users', 'username_unique_idx');
    },
};
