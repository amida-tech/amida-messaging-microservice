import p from '../../package';
import config from '../../config/config';

const version = p.version.split('.').shift();
export const baseURL = (version > 0 ? `/api/v${version}` : '/api');
export const auth = config.testToken; // user0
export const auth2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDUsInVzZXJuYW1lIjoidXNlcjIiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJhZG1pbiI6dHJ1ZSwic2NvcGVzIjpbImNsaW5pY2lhbiIsImFkbWluIl0sImlhdCI6MTU0MjIxMTIxOSwiZXhwIjozNjAwMDAwMDAwMDE1NDIyMDAwMDB9.TK-Q_gqFmBxCqJdMLDRZppx61t0gNT8hCD6-WkixsWc'; // user2
export { default as app } from '../../index';
