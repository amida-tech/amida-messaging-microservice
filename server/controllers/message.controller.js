import httpStatus from 'http-status';
import db from '../../config/sequelize';
import op from '../../config/sequelize';

const Message = db.Message;

/**
 * Load message and append to req.
 */
function load(req, res, next, id) {
    Message.findById(id)
    .then((message) => {
        if (!message) {
            const e = new Error('Message does not exist');
            e.status = httpStatus.NOT_FOUND;
            return next(e);
        }
        req.message = message; // eslint-disable-line no-param-reassign
        return next();
    })
    .catch(e => next(e));
}

/**
 * Get message
 * @returns {Message}
 * when message ID specified in the url
 */
function get(req, res) {
    if (req.message) {
        req.message.update({
            readAt: new Date(),
        });
    }
    return res.send(req.message);
}

/**
 * Send new message
 * @property {Array} req.body.to - Array of user IDs to send the message to.
 * @property {string} req.body.from - The user ID of the sender
 * @property {string} req.body.subject - Subject line of the message
 * @property {string} req.body.message - Body of the message
 * @returns {Message}
 */
function send(req, res, next) {
    // Each iteration saves the recipient's name from the to[] array as the owner to the db.
    // Defining a variable arrayLength before the loop wasn't working.
    // Getting 'arrayLength undefined' error
    const messageArray = [];

    // Saves separate instance where each recipient is the owner
    for (let i = 0; i < req.body.to.length; i += 1) {
        messageArray.push({
            to: req.body.to,
            from: req.body.from,
            subject: req.body.subject,
            message: req.body.message,
            owner: req.body.to[i],
            created: new Date(),
        });
    }
    Message.bulkCreate(messageArray);
    // Saves an instance where the sender is owner and readAt=current time
    Message.build({
        to: req.body.to,
        from: req.body.from,
        subject: req.body.subject,
        message: req.body.message,
        owner: req.body.from,
        created: new Date(),
        readAt: new Date(),
    }).save()
      .then(savedMessage => res.json(savedMessage))
      .catch(e => next(e));
}

function list() {}


/**
 * Return count and message IDs of all messages belonging to owner.
 * Return count and message IDs of unread messages belonging to owner.
 * "Owner" will not exist as part of url once this integrates with auth service.
 */
function count(req,res) {
    let queryObject = {};
    let whereObject = {};
    let countObject = {};

    if(req.query.option == "unread"){
        whereObject.owner = req.query.owner;
        whereObject.readAt = null;
        queryObject.where = whereObject;
        queryObject.attributes = ['id'];
    }else if(req.query.option == "all"){
        whereObject.owner = req.query.owner;
        queryObject.where = whereObject;
        queryObject.attributes = ['id'];
    }//else if(req.query.option == "both"){
    //}
    
    Message.findAndCountAll(queryObject)
        .then(result =>
            res.send(result));
}

function remove() {}

export default { send, get, list, count, remove, load };
