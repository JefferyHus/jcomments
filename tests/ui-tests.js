Tinytest.add('JComments - UI - config', function (test) {
  JComments.ui.config({
    limit: 20,
    loadMoreCount: 30,
    template: 'customFramework',
    defaultAvatar:'customUrl.png'
  });

  test.equal(JComments.ui.config().limit, 20);
  test.equal(JComments.ui.config().loadMoreCount, 30);
  test.equal(JComments.ui.config().template, 'customFramework');
  test.equal(JComments.ui.config().defaultAvatar, 'customUrl.png');
});

Tinytest.add('JComments - UI - setContent', function (test) {
  test.equal(JComments.session.get('content'), {});

  JComments.ui.setContent({
    edit: 'Editieren',
    remove: 'Löschen'
  });

  test.equal(JComments.session.get('content').edit, 'Editieren');
  test.equal(JComments.session.get('content').remove, 'Löschen');
});


Tinytest.addAsync('JComments - UI - callIfLoggedIn', function (test, done) {
  var originalUserId = Meteor.userId;

  Meteor.userId = function () {
    return false;
  };
  
  JComments.ui.callIfLoggedIn('remove comments', function () {
    throw new Meteor.Error('Should not execute this code');
  });

  test.equal(JComments.session.get('loginAction'), 'remove comments');

  Meteor.userId = function () {
    return true;
  };

  JComments.ui.callIfLoggedIn('remove comments', function () {
    Meteor.userId = originalUserId;
    done();
  });
});
