import express from 'express';
import passport from 'passport';

import threadsCtrl from '../controllers/threads.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.use(passport.authenticate('jwt', { session: false }));

router.route('/')
    .post(threadsCtrl.create);

router.route('/')
    .get(threadsCtrl.index);

router.route('/thread/:threadId/reply')
    .post(threadsCtrl.reply);

/**
 * url params:
 * - start_date: string, date in ISO 8601 format,
 *               to only get messages created or updated after the specified date
 */
router.route('/thread/:threadId')
    .get(threadsCtrl.show);

router.route('/thread/participants/:threadId')
    .get(threadsCtrl.getParticipants);

export default router;
