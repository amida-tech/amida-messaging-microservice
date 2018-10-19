
module.exports = {
    up(queryInterface) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.addIndex('Users', ['uuid']).then(() => queryInterface.addIndex('UserMessages', ['MessageId', 'UserId']));
    },
    down(queryInterface) {
        return queryInterface.removeIndex('Users', ['uuid']).then(() => queryInterface.removeIndex('UserMessages', ['MessageId',' UserId']));
    },
};
