/**
 * Setup collections for tests
 */

Meteor.methods({
  'removeGeneratedDocs': function (id) {
    check(id, String);
    JComments._collection.remove({ userId: id });
  }
});

if (Meteor.isClient) {
  Meteor.subscribe('allJComments');

  var id = JComments._collection.insert({ 'referenceId' : 'rawInsertDocId', 'content' : 'oldContent', 'userId' : 'works' });
  JComments._collection.update(id, { $set: { 'content' : 'newContent'} });

  JComments._collection.remove('shoudldNotBeRemovable');

  Accounts.createUser({
    username: 'test',
    password: 'test1234'
  });

} else if (Meteor.isServer) {
  JComments._collection.remove({});
  JComments._collection.insert({ 'referenceId' : 'othersDoc', 'userId' : 'someBodyElse', 'content' : 'nice' });

  Meteor.methods({
    'getDoc' : function (referenceId) {
      check(referenceId, String);
      return JComments._collection.findOne({ referenceId: referenceId });
    }
  });

  Meteor.publish('allJComments', function () {
    return JComments.getAll();
  });
}

/**
 * Run tests
 */

Tinytest.add('JComments - config', function (test) {
  const defaultConfig = JComments.config();
  test.equal(defaultConfig.publishUserFields, { profile: 1, emails: 1, username: 1 });

  JComments.config({
    something: 'wow'
  });

  const newConfig = JComments.config();
  test.equal(newConfig.something, 'wow');
});

if (Meteor.isClient) {
  Tinytest.add('JComments - add', function (test) {
    Meteor.call('removeGeneratedDocs', Meteor.userId());

    JComments.add('fakeDoc1', 'I liked this');
    JComments.add('fakeDoc1', 'I did not like it');
    JComments.add('fakeDoc1', '');

    var comments = JComments.get('fakeDoc1').fetch();
    test.equal(comments[0].content, 'I did not like it');
    test.equal(comments[0].userId, Meteor.userId());
    test.equal(comments[0].referenceId, 'fakeDoc1');
    test.equal(comments[1].content, 'I liked this');
    test.equal(comments[1].userId, Meteor.userId());
    test.equal(comments[1].referenceId, 'fakeDoc1');
  });

  Tinytest.add('JComments - get', function (test) {
    Meteor.call('removeGeneratedDocs', Meteor.userId());

    JComments.add('getDoc1', 'I will like it');
    JComments.add('getDoc1', 'I will like it not');
    JComments.add('getDoc2', 'This is another comment');

    test.equal(JComments.get('getDoc1').count(), 2);
    test.equal(JComments.get('getDoc2').count(), 1);
    test.equal(JComments.get('getDoc1').fetch()[0].userId, Meteor.userId());
    test.equal(JComments.get('getDoc1').fetch()[0].likes.length, 0);
    test.equal(JComments.get('getDoc1').fetch()[0].referenceId, 'getDoc1');
    test.equal(JComments.get('getDoc1').fetch()[0].content, 'I will like it not');
    test.equal(JComments.get('getDoc2').fetch()[0].content, 'This is another comment');
    test.equal(JComments.get('nonExistant').count(), 0);
  });

  Tinytest.add('JComments - getOne', function (test) {
    Meteor.call('removeGeneratedDocs', Meteor.userId());

    JComments.add('getDoc1', 'I will like it');

    var comment = JComments.getAll().fetch()[0];

    test.isUndefined(JComments.getOne());
    test.equal(comment._id, JComments.getOne(comment._id)._id);
    test.equal(comment.content, JComments.getOne(comment._id).content);
  });

  Tinytest.add('JComments - getAll', function (test) {
    Meteor.call('removeGeneratedDocs', Meteor.userId());

    JComments.add('getAllDoc1', 'I will like it all');
    JComments.add('getAllDoc2', 'I will like it all not');
    JComments.add('getAllDoc3', 'This is another all comment');

    var allJComments = JComments.getAll().fetch();
    test.equal(JComments.getAll().count(), 4);
    test.equal(allJComments[0].content, 'This is another all comment');
    test.equal(allJComments[0].referenceId, 'getAllDoc3');
    test.equal(allJComments[1].content, 'I will like it all not');
    test.equal(allJComments[1].referenceId, 'getAllDoc2');
    test.equal(allJComments[2].content, 'I will like it all');
    test.equal(allJComments[2].referenceId, 'getAllDoc1');
  });

  Tinytest.add('JComments - remove', function (test) {
    Meteor.call('removeGeneratedDocs', Meteor.userId());

    JComments.add('othersDoc', 'I like this, its my comment');

    var comments = JComments.get('othersDoc').fetch();

    test.equal(JComments.get('othersDoc').count(), 2);
    test.equal(comments[0].content, 'I like this, its my comment');
    test.equal(comments[0].userId, Meteor.userId());
    test.equal(comments[1].userId, 'someBodyElse');

    JComments.remove(comments[1]._id);

    comments = JComments.get('othersDoc').fetch();

    test.equal(JComments.get('othersDoc').count(), 2);
    test.equal(comments[0].userId, Meteor.userId());
    test.equal(comments[1].userId, 'someBodyElse');

    JComments.remove(comments[0]._id);

    comments = JComments.get('othersDoc').fetch();

    test.equal(JComments.get('othersDoc').count(), 1);
    test.equal(comments[0].userId, 'someBodyElse');
  });

  Tinytest.addAsync('JComments - Raw Collecton Remove', function (test, completed) {
    var id = JComments._collection.findOne({ referenceId: 'othersDoc' })._id;
    test.equal(!!id, true);

    JComments._collection.remove(id);
    Meteor.call('getDoc', 'othersDoc', function (err, doc) {
      test.equal(doc.content, 'nice');
      test.equal(doc.userId, 'someBodyElse');
      completed();
    });
  });

  Tinytest.add('JComments - like', function (test) {
    Meteor.call('removeGeneratedDocs', Meteor.userId());

    JComments.add('likesDoc', 'Please give me likes');

    var comments = JComments.get('likesDoc').fetch();
    test.equal(comments[0].content, 'Please give me likes');
    test.equal(comments[0].likes.length, 0);

    JComments.like(comments[0]._id);
    comments = JComments.get('likesDoc').fetch();
    test.equal(comments[0].likes.length, 1);

    JComments.like(comments[0]._id);
    comments = JComments.get('likesDoc').fetch();
    test.equal(comments[0].likes.length, 0);

    JComments.like(comments[0]._id);
    comments = JComments.get('likesDoc').fetch();
    test.equal(comments[0].likes.length, 1);
  });

  Tinytest.add('JComments - changeSchema', function (test) {
    JComments.changeSchema(function (currentSchema) {
      currentSchema.file = { type: Object, max: 15 };
      return currentSchema;
    });

    test.equal(JComments._collection.simpleSchema().schema().file, { type: Object, max: 15 });

    JComments.changeSchema(function (currentSchema) {
      currentSchema.image = { type: Object, optional: true };
    });

    test.equal(JComments._collection.simpleSchema().schema().image, { type: Object, optional: true });

    JComments.changeSchema(function (currentSchema) {
      currentSchema = null;
    });

    test.equal(JComments._collection.simpleSchema().schema().image, { type: Object, optional: true });

    JComments.changeSchema(function (currentSchema) {
      return false;
    });

    test.equal(JComments._collection.simpleSchema().schema().image, { type: Object, optional: true });
  });
}

if (Meteor.isServer) {
  Tinytest.add('JComments - Raw Collection Insert and Update', function (test) {
    test.equal(JComments.get('rawInsertDocId').count(), 0);
  });
}
