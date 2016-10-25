import { Meteor } from 'meteor/meteor'
import ClassMedia from '../../exports/media'
import ClassUser from '../../exports/user'

Template.commentsSingleComment.helpers(_.extend(defaultCommentHelpers, {
  customSingleCommentTemplate() {
    return defaultCommentHelpers.getCustomTemplate('singleCommentTemplate', 'commentsSingleComment', Template.parentData())
  },
  hasLiked() {
    return this.likes && this.likes.indexOf(ClassUser.getUserId()) > -1
  },
  isOwnComment() {
    return this.userId === ClassUser.getUserId()
  },
  isEditable() {
    const id = this._id || this.replyId
    return JComments.session.equals('editingDocument', id)
  },
  mediaContent() {
    return ClassMedia.getMarkup(this.media)
  },
  isRating: (type) => JComments.config().rating === type,
  rating() {
    return this.getStarRating()
  },
  canRate: () => ClassUser.getUserId(),
  forceRender() {
    this.getStarRating()
  },
  getRatingClass(type) {
    if ('user' === type) {
      return 'own-rating'
    }

    return ''
  },
  avatarUrl() {
    const config = JComments.ui.config()
    let avatar = config.defaultAvatar

    if (config.generateAvatar) {
      const uid = this.userId
      let user = Meteor.users.findOne(uid)

      avatar = config.generateAvatar(user) || avatar
    }

    return avatar
  }
}))

Template.commentsSingleComment.onRendered(function () {
  // fix wrong blaze rendering
  $('.stars-rating').each(function () {
    const starRatingElement = $(this)

    if (starRatingElement.data('rating') == 0) {
      starRatingElement.find('.current-rating').removeClass('current-rating')
    }
  })
})
