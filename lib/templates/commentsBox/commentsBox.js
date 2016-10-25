import ClassUser from '../../exports/user'

/**
 * Add a comment if the user has permission to do so.
 *
 * @param {Object} event
 * @param {String} type
 * @param {String} selector
 * @param {Function} callback
 */
const addComment = function (event, type, selector, callback) {
  const container = $(event.target).parent()

  if ("submit" === event.type) {
    event.preventDefault()
    executeUserAction(event, type, function () {
      var textarea = container.find(selector),
        value = textarea.val().trim()

      callback(textarea, value)
    })
  }
}

/**
 * Run user actions, such as adding comments etc.
 *
 * @param {Object} event
 * @param {String} type
 * @param {Function} callback
 */
const executeUserAction = function (event, type, callback) {
  if (ClassUser.notLoggedIn()) {
    throw Meteor.Error("Not allowed")
  } else {
    JComments.ui.callIfLoggedIn(type, callback)
  }
}

const loadMoreDocuments = (function () {
  const limit = JComments.ui.config().limit

  let currentOffset = limit,
    handles = []

  function clearHandles() {
    _.forEach(handles, handle => handle.stop())
    currentOffset = limit
    handles = []
  }

  Template.commentsBox.onDestroyed(() => clearHandles())

  JComments.ui.clearHandles = clearHandles

  /**
   * @param {Object} tplInstance
   */
  return function (tplInstance) {
    const loadMoreCount = JComments.ui.config().loadMoreCount

    handles.push(
      Meteor.subscribe('comments/reference', tplInstance.data.id, JComments.ui.getSorting(tplInstance.data.id), loadMoreCount, currentOffset)
    )

    currentOffset += loadMoreCount
  }
})()

JComments.session.set('content', {})

Template.commentsBox.onCreated(function () {
  JComments.session.setDefault(this.data.id + '_sorting', JComments.config().sortingOptions[0].value)

  this.autorun(() => {
    JComments.getCount(this.data.id, (err, count) => {
      JComments.session.set(this.data.id + '_count', count)
    })

    if (ClassUser.notLoggedIn()) {
      throw Meteor.Error("Not allowed")
    }
  })

  this.autorun(() => {
    if(Meteor.userId()) {
      JComments.session.set('loginAction', '')
    }
  })
})

Template.commentsBox.helpers(_.extend(defaultCommentHelpers, {
  customBoxTemplate() {
    return defaultCommentHelpers.getCustomTemplate('boxTemplate', 'commentsBox', this)
  },
  customHeaderTemplate() {
    return defaultCommentHelpers.getCustomTemplate('headerTemplate', 'commentsBox', this)
  },
  commentsBoxTitle() {
    let title = defaultCommentHelpers.take({
      hash: {
        key: 'title',
        'default': 'JComments'
      }
    })

    const data = Template.instance().data

    if (data && data.title) {
      title =  `${title} for ${data.title}`
    }

    return title
  },
  youNeedToLogin() {
    let title = defaultCommentHelpers.take({
      hash: {
        key: 'you-need-to-login',
        'default': 'You need to login to'
      }
    })

    const defLoginAction = JComments.session.get('loginAction')

    const loginAction = defaultCommentHelpers.take({
      hash: {
        key: defLoginAction,
        'default': defLoginAction
      }
    })

    return `${title} ${loginAction}`
  },
  comments() {
    return JComments.get(this.id, JComments.getSortOption(JComments.ui.getSorting(this.id)))
  }
}))

Template.commentsBox.events({
  'keydown .create-comment': _.debounce((e) => {
    if (e.originalEvent instanceof KeyboardEvent && e.keyCode === 13 && e.ctrlKey) {
      e.preventDefault()
      $(e.target).closest('form').find('.submit.button').click()
    }
  }, 50),
  'submit .comment-form' : function (e) {
    const eventScope = this
    console.log('huhu');
    addComment(e, 'add comments', '.create-comment', function (textarea, trimmedValue) {
      function actuallyAddComment() {
        JComments.add(eventScope.id, trimmedValue)
        textarea.val('')
      }

      if (trimmedValue) {
        actuallyAddComment()
      }
    })
  },
  'click .like-action' : function (event) {
    const eventScope = this

    executeUserAction(event, 'like comments', function () {
      if (eventScope._id) {
        JComments.like(eventScope._id)
      } else {
        return false
      }
    })
  },
  'click .stars-action': function (event) {
    const eventScope = this

    executeUserAction(event, 'rate comments', function () {
      const starRating = parseInt(
        $(event.target).parents('.stars-action').find('.stars-rating .current-rating').length,
        10
      )

      if (eventScope._id) {
        JComments.star(eventScope._id, starRating)
      } else
        return false
    })
  },
  'click .remove-action' : function () {
    const tplScope = Template.currentData(),
      eventScope = this

    JComments.ui.callIfLoggedIn('remove comments', function () {
      if (eventScope._id) {
        JComments.remove(eventScope._id)
        JComments.session.set(tplScope.id + '_count', (JComments.session.get(tplScope.id + '_count') - 1))
      } else
        return false
    })
  },
  'click .edit-action' : function (e) {
    const id = this._id || null

    $('.comment-content .text-span').attr('contenteditable', false)
    $(e.target)
      .closest('.comment')
      .find('.comment-content[data-id="' + id + '"] .text-span')
      .html(this.content)
      .attr('contenteditable', true)


    JComments.session.set('editingDocument', id)
  },
  'click .save-action' : function (e) {
    var id = this._id || null,
      contentBox = $(e.target).closest('.comment').find('.comment-content[data-id="' + id + '"] .text-span'),
      newContent = contentBox.text().trim()

    if (!newContent) {
      return null
    }

    contentBox.attr('contenteditable', false)
    JComments.session.set('editingDocument', '')

    if (this.content !== newContent) {
      contentBox.html('')
      if (this._id) {
        JComments.edit(id, newContent)
      } else
        return false
    }
  },
  'click .loadmore-action' : () => loadMoreDocuments(Template.instance())
})
