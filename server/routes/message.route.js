import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import messageCtrl from '../controllers/message.controller';
import auth from '../../config/passport'

const passportAuth = auth();
const router = express.Router(); // eslint-disable-line new-cap

router.use(passportAuth.authenticate);

router.route('/send')
    .post(validate(paramValidation.sendMessage), messageCtrl.send);

// userId should not exist;
// url should contain: ?limit=number, ?from=username, ?summary=true/false
router.route('/list/')
    .get(messageCtrl.list);

// userId should not exist; adding 'owner' for now; remove after integrating with auth service;
// url should contain: ?owner=username, ?option=unread/all
router.route('/count/')
    .get(messageCtrl.count);

router.route('/get/:messageId')
    .get(messageCtrl.get);

router.route('/delete/:messageId')
    .delete(messageCtrl.remove);

/** Load message when API with route parameter is hit */
router.param('messageId', messageCtrl.load);

export default router;
