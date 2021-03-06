import express from 'express';

import messageRoutes from './message.route';
import threadRoutes from './thread.route';
import threadsRoutes from './threads.route';
import userRoutes from './user.route';
import p from '../../package';

const router = express.Router(); // eslint-disable-line new-cap
const version = p.version.split('.').shift();
const baseURL = (version > 0 ? `/v${version}` : '');

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount message routes at /message
router.use(`${baseURL}/message`, messageRoutes);
router.use(`${baseURL}/thread`, threadRoutes);
router.use(`${baseURL}/threads`, threadsRoutes);
router.use(`${baseURL}/user`, userRoutes);

export default router;
