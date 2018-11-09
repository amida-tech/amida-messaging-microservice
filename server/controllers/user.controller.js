import httpStatus from 'http-status';
import db from '../../config/sequelize';
import APIError from '../helpers/APIError';

const User = db.User;

// TODO: refactor out the ID/email check into helper function
/**
 * Create and save a new user
 * Sends back JSON of the saved user
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function create(req, res, next) {
    const { username, uuid } = req.user;
    User.findOrCreate({ where: { username, uuid } })
    .spread((user, created) => { // eslint-disable-line no-unused-vars
        res.send(user);
    });
}

export default {
    create,
};
