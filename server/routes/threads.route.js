import express from 'express';
import passport from 'passport';
import config from '../../config/config'

import threadsCtrl from '../controllers/threads.controller';

function guard() {
    return function (req, res, next) {
      const { scopes } = req.user
      const found = config.threadScopes.some(r => scopes.includes(r))
      console.log("found", found)
      if ( found ) {
        return next()
      }
      else {
        const err = new APIError('There are no participants to create a thread', 'PARTICIPANTS_REQUIRED', httpStatus.BAD_REQUEST, true);
          console.log("err", err)
          return next(err)
      } 
    }
    
}
const router = express.Router(); // eslint-disable-line new-cap

router.use(passport.authenticate('jwt', { session: false }));

router.route('/')
    .post(
      guard(),
      threadsCtrl.create
    );

router.route('/')
    .get(
      threadsCtrl.index
    );

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
