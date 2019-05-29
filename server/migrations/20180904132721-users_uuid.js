const config = require('../../config/config');
const db = require('../../config/sequelize');
const rp = require('request-promise');
const uuidv4 = require('uuid/v4');


const User = db.User;

let adminToken = null;

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
            }).then(() => User.count()).then((numUsers) => {
                if (numUsers <= 0) {
                    return null;
                }
                // Login user that was created with token
                return rp({
                    method: 'POST',
                    url: `${config.authMicroService}/auth/login`,
                    body: {
                        username: `${config.microserviceAccessKey}`,
                        password: `${config.microservicePassword}`,
                    },
                    json: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
                        // eslint-disable-next-line no-param-reassign
                        user.username = user.username.toLowerCase();
                        // eslint-disable-next-line no-param-reassign
                        user.email = user.email.toLowerCase();
                        userArray[user.email] = user;
                    });


                    User.findAll({
                        where: {
                            uuid: { $eq: null },
                        },
                    }).then((users) => {
                        // console.log(users)
                        if (users.length > 0) {
                            users.forEach((user) => {
                                // eslint-disable-next-line no-param-reassign
                                user.username = user.username.toLowerCase();
                                if (!(user.username in userArray)) {
                                    const newUUID = uuidv4();
                                    // eslint-disable-next-line no-console
                                    console.log('User with email ', user.username, ' is missing from auth service');
                                    User.update({ uuid: newUUID }, { where: { id: user.id } });
                                } else {
                                    User.update(
                                        { uuid: userArray[user.username].uuid },
                                        { where: { id: user.id } });
                                }
                            });
                        }
                    });
                });
            });
    },
    down(queryInterface) {
        return queryInterface.removeColumn('Users', 'uuid');
    },
};
