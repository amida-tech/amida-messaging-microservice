const rp = require('request-promise');
const uuidv4 = require('uuid/v4');

const config = require('../../config/config');
const db = require('../../config/sequelize');
const logger = require('../../config/winston');

const User = db.User;

let adminToken = null;
let usersUpdated = 0; // eslint-disable-line no-unused-vars

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
                        const userLowerCase = user;
                        userLowerCase.username = user.username.toLowerCase();
                        userLowerCase.email = user.email.toLowerCase();
                        userArray[user.email] = userLowerCase;
                    });


                    User.findAll({
                        where: {
                            uuid: { $eq: null },
                        },
                    }).then((users) => {
                        if (users.length > 0) {
                            users.forEach((user) => {
                                // eslint-disable-next-line no-param-reassign
                                user.username = user.username.toLowerCase();
                                if (!(user.username in userArray)) {
                                    const newUUID = uuidv4();
                                    logger.info('User with email ', user.username, ' is missing from auth service');
                                    User.update({ uuid: newUUID }, { where: { id: user.id } });
                                    usersUpdated += 1;
                                } else {
                                    User.update(
                                        { uuid: userArray[user.username].uuid },
                                        { where: { id: user.id } });
                                    usersUpdated += 1;
                                }
                            });
                        }
                    });
                });
            }
            );
    },
    down(queryInterface, Sequelize) { // eslint-disable-line no-unused-vars
        return queryInterface.removeColumn('Users', 'uuid');
    },
};
