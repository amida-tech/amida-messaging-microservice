const config = require('../../config/config');
const db = require('../../config/sequelize');
const rp = require('request-promise');
const uuidv4 = require('uuid/v4');


const User = db.User;

const adminUser = {
    email: 'auth_admin@amida.com',
    username: 'auth_admin@amida.com',
    password: 'Testtest1!',
    scopes: ['admin'],
};
let adminToken = null;
let adminId = null;
let usersUpdated = 0;

module.exports = {
    up(queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.addColumn('Users', 'uuid',
            {
                type: Sequelize.UUID,
                unique: true,
                after: 'id',
                // primaryKey: true,
            }).then(() =>
            // Create new user on auth service if there are users without a uuid
                 rp({
                     method: 'POST',
                     url: `${config.authMicroService}/user`,
                     form: adminUser,
                 }).then((data) => {
                     adminId = JSON.parse(data).id;

                     // Login user that was created with token
                     return rp(
                         {
                             method: 'POST',
                             url: `${config.authMicroService}/auth/login`,
                             body: {
                                 username: adminUser.username,
                                 password: adminUser.password,
                             },
                             json: true,
                             headers: {
                                 'Content-Type': 'application/json',
                             },
                         });
                 }).then((data) => {
                     adminToken = data.token;

                     // Get all users and their uuid's from auth
                     return rp({
                         method: 'GET',
                         url: `${config.authMicroService}/user`,
                         headers: {
                             Authorization: `Bearer ${adminToken}`,
                             'Content-Type': 'application/json',
                         },
                         json: true,
                     });
                 }).then((data) => {
                     // Update all users on auth with uuids from auth, or generate one if
                     // auth does  not contain one

                     const userArray = [];
                     data.forEach((user) => {
                         user.username = user.username.toLowerCase();
                         user.email = user.email.toLowerCase();
                         userArray[user.username] = user;
                     });


                     User.findAll({
                         where: {
                             uuid: { $eq: null },
                         },
                     }).then((users) => {
                      // console.log(users)
                         if (users.length > 0) {
                             users.forEach((user) => {
                                 user.username = user.username.toLowerCase();
                                 if (!(user.username in userArray)) {
                                     const newUUID = uuidv4();
                                     console.log('User with email ', user.username, ' is missing from auth service');
                                     User.update({ uuid: newUUID }, { where: { id: user.id } });
                                     usersUpdated++;
                                 } else {
                                     User.update(
                                                  { uuid: userArray[user.username].uuid },
                                                  { where: { id: user.id } });
                                     usersUpdated++;
                                 }
                             });
                         } else {
                             console.log('\n\nERROR: Please migrate auth service to include the uuid column with the following command: `node_modules/.bin/sequelize db:migrate`\n\n');
                         }
                     });
                 }).then(res =>
                     // Delete user that was generated to run migration
                      rp({
                          method: 'DELETE',
                          url: `${config.authMicroService}/user/${adminId}`,
                          headers: {
                              Authorization: `Bearer ${adminToken}`,
                              'Content-Type': 'application/json',
                          },
                          json: true,
                      })));
    },
    down(queryInterface) {
        return queryInterface.removeColumn('Users', 'uuid');
    },
};
