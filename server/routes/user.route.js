import express from 'express';
import passport from 'passport';

import userCtrl from '../controllers/user.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.use(passport.authenticate('jwt', { session: false }));

router.route('/')
    .post(userCtrl.create);

export default router;
