/* eslint-env mocha */
import request from 'supertest';
import httpStatus from 'http-status';
import { expect } from 'chai';

import { auth, auth2, baseURL, app } from './common.integration.js';

describe('Threads API:', () => {
    describe('POST /threads/', () => {
        const createThreadBody = {
            participants: ['user0', 'user1'],
            subject: 'test subject',
            topic: 'test topic',
            message: 'test message',
        };
        it('fails on a request without participants', () =>
            request(app)
            .post(`${baseURL}/threads`)
            .set('Authorization', `Bearer ${auth}`)
            .send(Object.assign({}, createThreadBody, { participants: undefined }))
            .expect(httpStatus.BAD_REQUEST)
            .then((res) => {
                expect(res.body.status).to.equal('ERROR');
                expect(res.body.code).to.equal('PARTICIPANTS_REQUIRED');
            })
        );
        it('fails on a request with empty participants list', () =>
            request(app)
            .post(`${baseURL}/threads`)
            .set('Authorization', `Bearer ${auth}`)
            .send(Object.assign({}, createThreadBody, { participants: [] }))
            .expect(httpStatus.BAD_REQUEST)
            .then((res) => {
                expect(res.body.status).to.equal('ERROR');
                expect(res.body.code).to.equal('PARTICIPANTS_REQUIRED');
            })
        );
        it('fails on a request where participants doesn\'t include self', () =>
            request(app)
            .post(`${baseURL}/threads`)
            .set('Authorization', `Bearer ${auth}`)
            .send(Object.assign({}, createThreadBody, { participants: ['user1', 'user2'] }))
            .expect(httpStatus.BAD_REQUEST)
            .then((res) => {
                expect(res.body.status).to.equal('ERROR');
                expect(res.body.code).to.equal('PARTICIPANTS_MUST_INCLUDE_USER');
            })
        );
        it('succeeds on a proper request', () =>
            request(app)
            .post(`${baseURL}/threads`)
            .set('Authorization', `Bearer ${auth}`)
            .send(createThreadBody)
            .expect(httpStatus.CREATED)
            .then((res) => {
                expect(res.body.message).to.be.an('object');
                expect(res.body.message.from).to.equal('user0');
                expect(res.body.message.owner).to.equal('user0');
                expect(res.body.message.to).to.deep.equal(['user1']);
                expect(res.body.message.message).to.equal(createThreadBody.message);
                expect(res.body.message.subject).to.equal(createThreadBody.subject);
            })
        );
    });
    describe('POST /threads/thread/:threadId/reply', () => {
        let myThreadId;
        let otherThreadId;
        let otherThreadThatIncludesMeId;
        const nonExistentThreadId = -1;
        const replyBody = {
            message: 'test reply',
        };
        before(() => request(app)
            .post(`${baseURL}/threads`)
            .set('Authorization', `Bearer ${auth}`)
            .send({
                participants: ['user0', 'user1'],
                subject: 'test subject',
                message: 'test message',
                topic: 'test topic',
            })
            .expect(httpStatus.CREATED)
            .then((createMyThreadResponse) => {
                myThreadId = createMyThreadResponse.body.message.ThreadId;
                return request(app)
                .post(`${baseURL}/threads`)
                .set('Authorization', `Bearer ${auth2}`)
                .send({
                    participants: ['user2', 'user1'],
                    subject: 'test subject',
                    message: 'test message',
                    topic: 'test topic',
                })
                .expect(httpStatus.CREATED);
            })
            .then((createOtherThreadResponse) => {
                otherThreadId = createOtherThreadResponse.body.message.ThreadId;
                return request(app)
                .post(`${baseURL}/threads`)
                .set('Authorization', `Bearer ${auth2}`)
                .send({
                    participants: ['user0', 'user2'],
                    subject: 'test subject',
                    message: 'test message',
                    topic: 'test topic',
                })
                .expect(httpStatus.CREATED);
            })
            .then((createOtherThreadThatIncludesMeResponse) => {
                otherThreadThatIncludesMeId =
                    createOtherThreadThatIncludesMeResponse.body.message.ThreadId;
            })
        );
        it('fails on a reply to a nonexistent thread', () =>
            request(app)
            .post(`${baseURL}/threads/thread/${nonExistentThreadId}/reply`)
            .set('Authorization', `Bearer ${auth}`)
            .send(Object.assign({}, replyBody, {}))
            .expect(httpStatus.NOT_FOUND)
            .then((res) => {
                expect(res.body.status).to.equal('ERROR');
                expect(res.body.code).to.equal('THREAD_NOT_EXIST');
            })
        );
        it('fails on a reply to a thread we aren\'t included on', () =>
            request(app)
            .post(`${baseURL}/threads/thread/${otherThreadId}/reply`)
            .set('Authorization', `Bearer ${auth}`)
            .send(Object.assign({}, replyBody, {}))
            .expect(httpStatus.NOT_FOUND)
            .then((res) => {
                expect(res.body.status).to.equal('ERROR');
                expect(res.body.code).to.equal('THREAD_NOT_EXIST');
            })
        );
        it('succeeds on reply to a thread I started', () =>
            request(app)
            .post(`${baseURL}/threads/thread/${myThreadId}/reply`)
            .set('Authorization', `Bearer ${auth}`)
            .send(Object.assign({}, replyBody, {}))
            .expect(httpStatus.CREATED)
            .then((res) => {
                expect(res.body.message).to.be.an('object');
                expect(res.body.message.from).to.equal('user0');
                expect(res.body.message.owner).to.equal('user0');
                // expect(res.body.message.to).to.deep.equal(['user1']); // Not Implemented
                expect(res.body.message.message).to.equal(replyBody.message);
            })
        );
        it('succeeds on reply to a thread I didn\'t start but am included on', () =>
            request(app)
            .post(`${baseURL}/threads/thread/${otherThreadThatIncludesMeId}/reply`)
            .set('Authorization', `Bearer ${auth}`)
            .send(Object.assign({}, replyBody, {}))
            .expect(httpStatus.CREATED)
            .then((res) => {
                expect(res.body.message).to.be.an('object');
                expect(res.body.message.from).to.equal('user0');
                expect(res.body.message.owner).to.equal('user0');
                // expect(res.body.message.to).to.deep.equal(['user2']); // Not Implemented
                expect(res.body.message.message).to.equal(replyBody.message);
            })
        );
    });
    describe('GET /threads/thread/:threadId', () => {
        let threadId;
        let otherThreadId;

        const originalMessage = {
            participants: ['user0', 'user1'],
            subject: 'test subject',
            message: 'test message',
            topic: 'test topic',
        };
        const replyOne = {
            message: 'reply 1',
        };
        const replyTwo = {
            message: 'reply 2',
        };

        before(() => request(app)
            .post(`${baseURL}/threads`)
            .set('Authorization', `Bearer ${auth}`)
            .send(originalMessage)
            .expect(httpStatus.CREATED)
            .then((createThreadResponse) => {
                const msg = createThreadResponse.body.message;
                originalMessage.id = msg.id;
                threadId = msg.ThreadId;
                return request(app)
                .post(`${baseURL}/threads/thread/${threadId}/reply`)
                .set('Authorization', `Bearer ${auth}`)
                .send(replyOne)
                .expect(httpStatus.CREATED);
            })
            .then((replyOneResponse) => {
                replyOne.id = replyOneResponse.body.message.id;
                return request(app)
                .post(`${baseURL}/threads/thread/${threadId}/reply`)
                .set('Authorization', `Bearer ${auth}`)
                .send(replyTwo)
                .expect(httpStatus.CREATED);
            })
            .then(replyTwoResponse => request(app)
                .delete(`${baseURL}/message/delete/${replyTwoResponse.body.message.id}`)
                .set('Authorization', `Bearer ${auth}`)
                .send()
                .expect(httpStatus.OK)
            )
            .then(() => request(app)
                .post(`${baseURL}/threads`)
                .set('Authorization', `Bearer ${auth2}`)
                .send({
                    participants: ['user1', 'user2'],
                    subject: 'test subject',
                    message: 'test message',
                    topic: 'test topic',
                })
                .expect(httpStatus.CREATED)
            )
            .then((createOtherThreadResponse) => {
                otherThreadId = createOtherThreadResponse.body.message.ThreadId;
            })
        );

        it('should return OK', () => request(app)
            .get(`${baseURL}/threads/thread/${threadId}`)
            .set('Authorization', `Bearer ${auth}`)
            .expect(httpStatus.OK));

        it('should return an array of messages with ids in reply order', () => request(app)
            .get(`${baseURL}/threads/thread/${threadId}`)
            .set('Authorization', `Bearer ${auth}`)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.be.an('array');
                expect(res.body.map(body => body.id)).to.deep.equal(
                    [originalMessage.id, replyOne.id]);
            }));

        it('should return an array with bodies matching the specified messages', () =>
            request(app)
            .get(`${baseURL}/threads/thread/${threadId}`)
            .set('Authorization', `Bearer ${auth}`)
            .expect(httpStatus.OK)
            .then((res) => {
                const messageRequests = [{ message: originalMessage.message }, replyOne];
                res.body.forEach((message, index) =>
                    expect(message).to.deep.include(messageRequests[index]));
            }));

        it('should 404 with unfound id', () =>
            request(app)
            .get(`${baseURL}/threads/thread/-1`)
            .set('Authorization', `Bearer ${auth}`)
            .expect(httpStatus.NOT_FOUND)
            .then((res) => {
                expect(res.body.code).to.equal('THREAD_NOT_EXIST');
                expect(res.body.status).to.equal('ERROR');
            })
        );

        it('should 404 with inaccessible id', () =>
            request(app)
            .get(`${baseURL}/threads/thread/${otherThreadId}`)
            .set('Authorization', `Bearer ${auth}`)
            .expect(httpStatus.NOT_FOUND)
            .then((res) => {
                expect(res.body.code).to.equal('THREAD_NOT_EXIST');
                expect(res.body.status).to.equal('ERROR');
            })
        );
    });
});
