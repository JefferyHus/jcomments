import ClassUser from '../exports/user'

defaultCommentHelpers = {
  take: function (params) {
    var content = JComments.session.get('content');

    if (content && content[params.hash.key]) {
      return content[params.hash.key];
    }

    return params.hash.default;
  },
  /**
   * Return custom templates with helpers from commentsBox
   *
   * @param {String} templateName
   * @param {String} originalTemplate
   * @param {Object} templateScope
   *
   * @returns {Object}
   */
  getCustomTemplate: function (templateName, originalTemplate, templateScope) {
    if (_.isString(templateScope[templateName])) {
      Template[templateScope[templateName]].inheritsHelpersFrom(originalTemplate);
      return Template[templateScope[templateName]];
    }
  },
  hasMoreComments: function () {
    return JComments.get(this.id).count() < JComments.session.get(this.id + '_count');
  },
  commentId: function () {
    return this._id || null;
  },
  configGet: (key) => JComments.config()[key],
  uiConfigGet: (key) => JComments.ui.config()[key],
  sessionGet: (key) => JComments.session.get(key),
  templateIs: (name) => name === JComments.ui.config().template,
  textarea: () => Template.commentsTextarea
};
