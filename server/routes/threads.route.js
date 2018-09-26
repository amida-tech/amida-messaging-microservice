import express from 'express';
import passport from 'passport';

import threadsCtrl from '../controllers/threads.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.use(passport.authenticate('jwt', { session: false }));

// Create a thread
router.route('/')
    .post(threadsCtrl.create);

router.route('/')
    .get(threadsCtrl.index);

// Reply to thread
router.route('/thread/:threadId/reply')
    .post(threadsCtrl.reply);

router.route('/thread/:threadId')
    .get(threadsCtrl.show);

router.route('/thread/participants/:threadId')
    .get(threadsCtrl.participants);

export default router;
