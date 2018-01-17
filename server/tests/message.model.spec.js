/* eslint-env mocha */

import chai, { expect } from 'chai';
import {
    Message,
    sequelize
} from '../../config/sequelize';
import _ from 'lodash';

chai.use(require('chai-datetime'));

const testMessageObject = {
    owner: 'user1',
    to: ['user1'],
    from: 'user0',
    subject: 'Test Message',
    message: 'Test post please ignore',
    createdAt: new Date(),
};

describe('Message Model:', () => {

    before(() => Message.sync({force: true}));
    
    //after(() => Message.destroy({truncate: true}));

    describe('Object creation', () => {

        it('Create Message', () => Message
            .create(testMessageObject)
            .then(message => expect(message).to.exist)
        );

        it('Verify message', () => Message
            .create(testMessageObject)
            .then(message => Message
                .findById(message.id)
                .then(message => {
                    expect(message.owner).to.equal(testMessageObject.owner);
                    expect(message.originalMessageId).to.be.null;
                    expect(message.parentMessageId).to.be.null;
                    expect(message.to).to.deep.equal(testMessageObject.to);
                    expect(message.from).to.equal(testMessageObject.from);
                    expect(message.subject).to.equal(testMessageObject.subject);
                    expect(message.message).to.equal(testMessageObject.message);
                    expect(message.createdAt).to.equalDate(testMessageObject.createdAt);
                    expect(message.readAt).to.be.null;
                    return;
                })
            )
        );

    });

});
