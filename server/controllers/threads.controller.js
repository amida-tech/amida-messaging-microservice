import httpStatus from 'http-status';
import Promise from 'bluebird';
import Sequelize from 'sequelize';
import db from '../../config/sequelize';
import APIError from '../helpers/APIError';
import notificationHelper from '../helpers/notificationHelper';

const Message = db.Message;
const Thread = db.Thread;
const User = db.User;
const UserThread = db.UserThread;
const sequelize = db.sequelize;
const Op = Sequelize.Op;

function notifyUsers(users, sender, message) { // eslint-disable-line no-unused-vars
    const pushNotificationArray = [];
    users.forEach((user) => {
        if (user.username !== sender.username) {
            const pushNotificationData = {
                username: user.username,
                notificationType: 'New Message',
                // TODO ARH: After legal consult, potentially change title and body back to these.
                // title: 'New Message',
                // body: `${sender.username} sent you a message`,
                title: 'Notification:',
                body: 'You have a new message.',
            };
            pushNotificationArray.push(pushNotificationData);
        }
    });
    notificationHelper.sendPushNotifications(pushNotificationArray);
}

/**
 * Start a new thread
 * @property {Array} req.body.participants - Array of usernames to include in the thread.
 * @property {string} req.body.subject - Subject line of the message
 * @property {string} req.body.message - Body of the message
 * @property {string} req.body.topic - Topic of the thread
 * @returns {Message}
 */
function create(req, res, next) {
    const { username } = req.user;
    const participants = req.body.participants;
    const logUser = req.body.logUser;
    const tags = req.body.tags || [];
    const users = [];
    const userPromises = [];
    const date = new Date();
    let threadId = null;
    let userId = null;
    let logUserId = null;
    let sender = null;
    let message = null;

    // Error message if blank array is sent to API
    if (participants === undefined || participants.length === 0) {
        const err = new APIError('There are no participants to create a thread', 'PARTICIPANTS_REQUIRED', httpStatus.BAD_REQUEST, true);
        return next(err);
    } else if (participants.find(p => p === username) === undefined) {
        const err = new APIError('You must include yourself to create a thread', 'PARTICIPANTS_MUST_INCLUDE_USER', httpStatus.BAD_REQUEST, true);
        return next(err);
    }


    const extractIdAndPushUser = (user) => {
        if (user.username === username) {
            userId = user.id;
        }
        if (logUser && user.username === logUser) {
            logUserId = user.id;
        }
        users.push(user);
    };

    for (const participant of participants) {
        const userPromise = User.findOrCreate({ where: { username: participant } })
            .spread(extractIdAndPushUser);
        userPromises.push(userPromise);
    }

    return Promise.all(userPromises).then(() =>
        Thread.create({
            topic: req.body.topic,
            lastMessageSent: date,
            logUserId,
            tags,
        })
    )
    .then((thread) => {
        thread.setUsers(users);
        sender = users.find(s => s.username === username);
        threadId = thread.id;

        return Message.create({
            from: username,
            to: participants.filter(p => p !== username),
            owner: username,
            subject: '',
            message: req.body.message,
            SenderId: sender.id,
            ThreadId: thread.id,
            LastMessageId: thread.id,
            // ^ adding LastMessageId while creating is okay as this is the
            // first message in thread
        });
    })
    .then((msg) => {
        message = msg;

        // Get lastMessageId added to Thread
        const updateThread = Thread.update({
            lastMessageId: message.id,
        }, {
            where: { id: threadId },
        });

        const updateUserThread = UserThread.update({
            lastMessageRead: true,
        }, {
            where: {
                UserId: userId,
                ThreadId: threadId,
            },
        });

        // I simply passed the LastMessageId and ThreadId properties while creating
        // the message as alternative to calling the methods below to save the extra
        // db operation
        // thread.addMessage(message);
        // thread.setLastMessage(message); EG

        const addUserMessagePromises = [];
        for (const user of users) {
            addUserMessagePromises.push(user.addMessage(message));
        }

        return Promise.all([updateThread, updateUserThread, ...addUserMessagePromises]);
    })
    .then(() => {
        notifyUsers(users, sender, message);
        res.status(httpStatus.CREATED);
        res.send({ message });
    })
    .catch(e => next(e));
}

/**
 * Replies to an existing thread
 * @property {string} req.body.message - Body of the message
 * @property {Number} req.params.threadId - DB ID of the thread being replied to
 * @returns {Message}
 */
function reply(req, res, next) {
    const date = new Date();
    User.findOrCreate({ where: { username: req.user.username } }).spread(user =>
        user.getThreads({ where: { id: req.params.threadId } })
    )
    .then((threads) => {
        const thread = threads[0];
        if (!thread) {
            const err = new APIError('Thread does not exist', 'THREAD_NOT_EXIST', httpStatus.NOT_FOUND, true);
            throw err;
        }
        const { username } = req.user;
        return User.findOne({ where: { username } }).then((currentUser) => {
            Message.create({
                from: username,
                to: [],
                owner: username,
                subject: '',
                message: req.body.message,
                SenderId: currentUser.id,
                // ^ set sender id while creating instead of doing
                // message.setSender(currentUser) later
            }).then((message) => {
                thread.addMessage(message);
                thread.setLastMessage(message);
                thread.update({
                    lastMessageSent: date,
                    lastMessageId: message.id,
                });
                UserThread.update({
                    lastMessageRead: false,
                }, {
                    where: {
                        ThreadId: thread.id,
                        UserId: {
                            [Op.ne]: currentUser.id,
                        },
                    },
                });
                thread.getUsers().then((users) => {
                    const addUserMessagePromises = [];
                    users.forEach((user) => {
                        const addUserMessagePromise = user.addMessage(message);
                        addUserMessagePromises.push(addUserMessagePromise);
                    });
                    Promise.all(addUserMessagePromises).then(() => {
                        notifyUsers(users, currentUser, message);
                        res.status(httpStatus.CREATED);
                        res.send({ message });
                    });
                });
            });
        });
    })
    .catch(e => next(e));
}

/**
 * Returns messages for a thread
 * @property {Number} req.params.threadId - DB ID of the thread
 * @property {string} req.query.start_date - Date in ISO 8601 format
 *                                           only messages updated after this date will be returned
 * @returns {[Message]}
 */
function show(req, res, next) {
    User.findOrCreate({ where: { username: req.user.username } }).spread(user =>
        user.getThreads({ where: { id: req.params.threadId } })
    )
    .then((threads) => {
        const thread = threads[0];
        if (!thread) {
            const err = new APIError('Thread does not exist', 'THREAD_NOT_EXIST', httpStatus.NOT_FOUND, true);
            throw err;
        }
        const { username } = req.user;
        User.findOne({ where: { username } }).then((currentUser) => {
            UserThread.update({
                lastMessageRead: true,
            }, {
                where: {
                    ThreadId: thread.id,
                    UserId: currentUser.id,
                },
            });
        });

        // Filter by date if start_date query param is given
        const where = {};
        if (req.query.start_date) {
            const startDate = new Date(req.query.start_date);
            where.where = {
                createdAt: {
                    [Op.gte]: startDate,
                },
            };
        }

        return thread.getMessages({
            include: [{
                association: 'Sender',
            }],
            // Order messages here by ascending.
            // Table assigns id in chronological order as messages are created
            order: [
              ['id', 'ASC'],
            ],
            ...where,
        }).then((messages) => {
            res.send(messages);
        });
    })
    .catch(e => next(e));
}


/**
 * Returns a the current user and a list of the current user's threads
 * @returns {User}
 */
function index(req, res, next) {
    const { username } = req.user;
    const { logUsername } = req.query;

    if (username === logUsername) {
        sequelize.query('SELECT * FROM "Users" as A inner join "UserThreads" as UserThread on A."id" = UserThread."UserId" inner join "Threads" as E on UserThread."ThreadId" = E."id" and (E."logUserId" = A."id" OR E."logUserId" is null ) inner join "Messages" as LastMessage on E."lastMessageId" = LastMessage."id" Where A.username = :username Order By "lastMessageSent" DESC',
            { replacements: { username }, type: sequelize.QueryTypes.SELECT }
        ).then((logData) => {
            if (!logData) {
                const err = new APIError('There are no threads for the current user', httpStatus.NOT_FOUND, true);
                throw err;
            }
            return res.send(logData);
        })
        .catch(e => next(e));
    } else {
        sequelize.query('SELECT A.*, UserThread.*, E.*, LastMessage.* FROM "Users" as A inner join "UserThreads" as UserThread on A."id" = UserThread."UserId" inner join "Threads" as E on UserThread."ThreadId" = E."id" inner join "Users" as D on E."logUserId" = D."id" inner join "Messages" as LastMessage on E."lastMessageId" = LastMessage."id"  Where A.username = :username and  D.username = :logUsername Order By "lastMessageSent" DESC',
            { replacements: { username, logUsername }, type: sequelize.QueryTypes.SELECT }
        ).then((logData) => {
            if (!logData) {
                const err = new APIError('There are no threads for the current user', httpStatus.NOT_FOUND, true);
                throw err;
            }
            return res.send(logData);
        })
        .catch(e => next(e));
    }
}

// Find all users in a threadid, not including self
function getParticipants(req, res, next) {
    User.findOrCreate({ where: { username: req.user.username } }).spread(user =>
        user.getThreads({ where: { id: req.params.threadId } })
    )
    .then((threads) => {
        const thread = threads[0];
        if (!thread) {
            const err = new APIError('Thread does not exist', 'THREAD_NOT_EXIST', httpStatus.NOT_FOUND, true);
            throw err;
        }
        return thread.getUsers({
            where: {
                username: {
                    [Op.ne]: req.user.username,
                },
            },
        });
    })
    .then(users => res.send(users))
    .catch(e => next(e));
}

export default {
    create,
    reply,
    show,
    getParticipants,
    index,
};
