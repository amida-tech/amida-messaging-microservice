const config = require('../../config/config');
const babel = require('babel-core/register');
const db = require('../../config/sequelize');
const request = require('request');

// console.log(config)

const User = db.User;

const makeRequest = (data, callback) => {
    console.log(data);
    request.post(data, callback);
};
const getRequest = (data, callback) => {
    console.log(data);
    request.get(data, callback);
};
const deleteRequest = (data, callback) => {
    request.delete(data, callback);
};
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
            }).then(() => {
            // Create new user on auth service if there are users without a uuid
                makeRequest({
                    url: `${config.authMicroService}/user`,
                    form: adminUser,
                }, (err, httpResponse) => {
                    if (err) {
                        console.log(err);
                    } else if (httpResponse.statusCode !== 200 && httpResponse.statusCode !== 201) {
                        console.log(errors.USER_CREATION_GENERIC_ERROR);
                        console.log('\n\nERROR: Please migrate auth service to include the uuid column with the following command: `node_modules/.bin/sequelize db:migrate`\n\n');
                    }

                    adminId = JSON.parse(httpResponse.body).id;
                });
            }).then(() => {
                // Authenticate new admin user on auth service
                makeRequest({
                    url: `${config.authMicroService}/auth/login`,
                    body: {
                        username: adminUser.username,
                        password: adminUser.password,
                    },
                    json: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }, (err, httpResponse) => {
                    if (err) {
                        console.log(err);
                    } else if (httpResponse.statusCode !== 200 && httpResponse.statusCode !== 201) {
                        console.log(errors.USER_CREATION_GENERIC_ERROR);
                    }
                    adminToken = httpResponse.body.token;

                    console.log(httpResponse);
              // }).then(() => {
                    getRequest({
                        url: `${config.authMicroService}/user`,
                        headers: {
                            Authorization: `Bearer ${adminToken}`,
                            'Content-Type': 'application/json',
                        },
                        json: true,
                    }, (err, httpResponse) => {
                        if (err) {
                            console.log(err);
                        } else if (httpResponse.statusCode !== 200 && httpResponse.statusCode !== 201) {
                            console.log(errors.USER_CREATION_GENERIC_ERROR);
                        }
                        const userData = httpResponse.body;
                        const userArray = [];

                        console.log(userData);


                        userData.forEach((user) => {
                            user.username = user.username.toLowerCase();
                            user.email = user.email.toLowerCase();
                            userArray[user.username] = user;
                        });

                        User.findAll({
                            where: {
                                uuid: { $eq: null },
                            },

                        }).then((users) => {
                            if (users.length > 0) {
                                users.email = users.email.toLowerCase();
                                if (!(users.email in userArray)) {
                                    console.log('User with email ', users.email, ' is missing from auth service');
                                } else {
                                    users.updateAttributes({ uuid: userArray[user.username].uuid });
                                      // .update(uuid: uuid, { where: users.id });
                                    usersUpdated++;
                                }
                            } else {
                                console.log('\n\nERROR: Please migrate auth service to include the uuid column with the following command: `node_modules/.bin/sequelize db:migrate`\n\n');
                            }

                            deleteRequest({
                                url: `${config.authMicroService}/user/${adminId}`,
                                headers: {
                                    Authorization: `Bearer ${adminToken}`,
                                    'Content-Type': 'application/json',
                                },
                                json: true,
                            }, (err, httpResponse) => {
                                if (err) {
                                    console.log(err);
                                } else if (httpResponse.statusCode !== 204) {
                                    console.log(errors.USER_CREATION_GENERIC_ERROR);
                                }
                                console.log(`\nMigrated ${usersUpdated} new uuid(s) successfully!\n`);
                            });
                                // res.send();
                        });
                    });
                });
            });
    },
    down(queryInterface) {
        return queryInterface.removeColumn('Users', 'uuid');
    },
};
