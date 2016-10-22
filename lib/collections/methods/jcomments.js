import ClassUser from '../../exports/user'
import ClassMedia from '../../exports/media'

const notToOpt = {
	validate: false,
	filter: false,
	getAutoValues: false,
	removeEmptyStrings: false
}

/**
 * Call a meteor method with user id if there is as the last argument.
 *
 * @param {String} methodName
 * @param {Array} methodArgs
 */
function callWithUserData(methodName, ...methodArgs) {
  const UserData = {}
  Meteor.apply(methodName, [...methodArgs, UserData])
}

/**
 * call a service function
 * @param  {string} name    service name to be called
 * @param  {string} action  the method name
 * @param  {object} payload additional options or params
 * @return {void}
 */
const triggerEvent = (name, action, payload) => {
  const func = JComments.config().onEvent

  if (_.isFunction(func)) {
    func(name, action, payload)
  }
}
/**
 * calculates the avrage  rating of a comment
 * @param  {object} doc   comment to get its ratings
 * @return {decimal}
 */
const getRatingScore = (doc) => {
  let score = JJCommentsCollection._calculateAverageRating(doc.starRatings)

  if (score ===  0) {
    score = doc.likes.length
  }

  return score
}
/**
 * Updates the rating score for a passed comment into database
 * @param  {string} _id   id of the comment
 * @return {void}
 */
const updateRatingScoreOnDoc = (_id) => {
  JJCommentsCollection.update({ _id }, {
    $set: { ratingScore: getRatingScore(JJCommentsCollection.findOne(_id)) }
  })
}
/**
 * 
 */
const anonUserDetected = () => {
	if( !Meteor.userId() )
		throw new Meteor.Error('not-authorized')
	else
		return true
}
/**
 * gets the reference id of a specified document
 * @param  {string} documentId
 * @return {string}
 */
const getReferenceIdByDocumentId = documentId => JJCommentsCollection.findOne({ _id: documentId }, { fields: { referenceId: 1 } }).referenceId

Meteor.methods({
  'comments/add': function (referenceId, content, _UserData) {
    check(referenceId, String)
    check(content, String)

    const userId = this.userId || anonUserDetected()

    content = content.trim()

    if (userId && content) {
      const doc = {
        referenceId,
        content,
        userId,
        createdAt: (new Date()),
        likes: [],
        replies: [],
 
        media: ClassMedia.getMediaFromContent(content)
      }

      const docId = JCommentsCollection.insert(doc)

      triggerEvent('comment', 'add', Object.assign({}, doc, { _id: docId }))
    }
  },
  'comments/edit': function (documentId, newContent, _UserData) {
    check(documentId, String)
    check(newContent, String)

    const userId = this.userId || anonUserDetected()

    newContent = newContent.trim()

    if (!userId || !newContent) {
      return
    }

    const setDoc = { content: newContent, likes: [], media: ClassMedia.getMediaFromContent(newContent), ratingScore: 0 }
    const findSelector = { _id: documentId, userId }

    JCommentsCollection.update(
      findSelector,
      { $set: setDoc }
    )

    triggerEvent('comment', 'edit', Object.assign({}, setDoc, findSelector))
  },
  'comments/remove': function (documentId, _UserData) {
    check(documentId, String)

    const userId = this.userId || anonUserDetected()

    const removeSelector = { _id: documentId, userId }

    const doc = JCommentsCollection.findOne(removeSelector)

    JCommentsCollection.remove(removeSelector)

    triggerEvent('comment', 'remove', doc)
  },
  'comments/like': function (documentId, _UserData) {
    check (documentId, String)

    const userId = this.userId || anonUserDetected()

    if (!userId || JComments.config().rating !== 'likes') {
      return
    }

    const findSelector = { _id: documentId }

    const likedDoc = JCommentsCollection.findOne({ _id: documentId, likes: { $in: [userId] } })

    if (likedDoc) {
      JCommentsCollection.update(findSelector, { $pull: { likes: userId } }, noOptOptions)
    } else {
      JCommentsCollection.update(findSelector, { $push: { likes: userId } }, noOptOptions)
    }

    updateRatingScoreOnDoc(documentId)

    triggerEvent('comment', 'like', Object.assign({}, likedDoc, findSelector, {
      ratedUserId: userId
    }))
  },
  'comments/star': function (documentId, starsCount, _UserData) {
    check(documentId, String)
    check(starsCount, Number)

    const userId = this.userId || anonUserDetected()

    if (!userId || JComments.config().rating !== 'stars') {
      return
    }

    const findSelector = { _id: documentId }

    const starredDoc = JCommentsCollection.findOne({ _id: documentId, 'starRatings.userId': userId })

    if (starredDoc) {
      JCommentsCollection.update(findSelector, { $pull: { starRatings : { userId } } }, noOptOptions)
    }

    JCommentsCollection.update(findSelector, { $push: { starRatings: { userId, rating: starsCount } } })

    updateRatingScoreOnDoc(documentId)

    triggerEvent('comment', 'star', Object.assign({}, starredDoc, findSelector, {
      ratedUserId: userId,
      rating: starsCount
    }))
  },
  'comments/reply/add': function (documentId, docScope, content, _UserData) {
    check(documentId, String)
    check(docScope, Object)
    check(content, String)

    const doc = JCommentsCollection.findOne({ _id: documentId }),
      userId = this.userId || anonUserDetected()

    content = content.trim()

    if (!doc || !userId || !content || !allowReplies(documentId)) {
      return false
    }

    const reply = {
      replyId: Random.id(),
      content: content,
      userId: userId,
      createdAt: (new Date()),
      replies: [], likes: [],
      lastUpdatedAt: (new Date()),
      media: ClassMedia.getMediaFromContent(content),
      ratingScore: 0
    }

    check(reply, JCommentsCollection.schemas.ReplySchema)

    let fieldDescriptor = 'replies'

    if (docScope.position) {
      fieldDescriptor = getMongoReplyFieldDescriptor(docScope.position) + '.replies'
    }

    const modifier = {
      $push: {
        [fieldDescriptor]: {
          $each: [reply],
          $position: 0
        }
      }
    }

    const findSelector = { _id: documentId }

    JCommentsCollection.update(findSelector, modifier, noOptOptions)
    triggerEvent('reply', 'add', Object.assign({}, reply, findSelector, {
      userId,
      rootUserId: doc.userId
    }))
  },
  'comments/reply/edit': function (documentId, docScope, newContent, _UserData) {
    check(documentId, String)
    check(docScope, Object)
    check(newContent, String)


    const doc = JCommentsCollection.findOne(documentId),
      userId = this.userId || anonUserDetected()

    let reply = {}

    newContent = newContent.trim()

    if (!userId || !newContent || !allowReplies(documentId)) {
      return
    }

    modifyNestedReplies(doc.replies, docScope.position, function (replies, index) {
      if (replies[index].userId === userId) {
        replies[index].content = newContent
        replies[index].likes = []
        replies[index].starRatings = []
        replies[index].ratingScore = 0
        replies[index].media = ClassMedia.getMediaFromContent(newContent)
        reply = replies[index]
      }
    })

    const findSelector = { _id: documentId }

    JCommentsCollection.update(findSelector, { $set: { replies: doc.replies } }, noOptOptions)
    triggerEvent('reply', 'edit', Object.assign({}, findSelector, reply, {
      ratedUserId: userId,
      rootUserId: doc.userId
    }))
  },
  'comments/reply/like': function (documentId, docScope, _UserData) {
    check(documentId, String)
    check(docScope, Object)

    const doc = JCommentsCollection.findOne({ _id: documentId }),
      userId = this.userId || anonUserDetected()

    if (!userId || !allowReplies(documentId) || JComments.config().rating !== 'likes') {
      return false
    }

    let reply = {}

    modifyNestedReplies(doc.replies, docScope.position, function (replies, index) {
      if (replies[index].likes.indexOf(userId) > -1) {
        replies[index].likes.splice(replies[index].likes.indexOf(userId), 1)
      } else {
        replies[index].likes.push(userId)
      }

      reply = replies[index]
      replies[index].ratingScore = getRatingScore(replies[index])
    })

    const findSelector = { _id: documentId }

    JCommentsCollection.update(findSelector, { $set: { replies: doc.replies }  }, noOptOptions)
    triggerEvent('reply', 'like', Object.assign({}, reply, findSelector, {
      ratedUserId: userId,
      rootUserId: doc.userId
    }))
  },
  'comments/reply/star': function (documentId, docScope, starsCount, _UserData) {
    check(documentId, String)
    check(docScope, Object)
    check(starsCount, Number)

    const doc = JCommentsCollection.findOne({ _id: documentId }),
      userId = this.userId || anonUserDetected()

    if (!userId || !allowReplies(documentId) || JComments.config().rating !== 'stars') {
      return false
    }

    let reply = {}

    modifyNestedReplies(doc.replies, docScope.position, function (replies, index) {
      let starRatings = replies[index].starRatings

      if (!starRatings) {
        starRatings = []
      }

      let ratings = starRatings

      if (_.find(starRatings, rating => rating.userId === userId)) {
        ratings = _.filter(starRatings, rating => rating.userId !== userId)
      }

      ratings.push({ userId, rating: starsCount })
      replies[index].starRatings = ratings
      replies[index].ratingScore = getRatingScore(replies[index])
      reply = replies[index]
    })

    const findSelector = { _id: documentId }

    JCommentsCollection.update(findSelector, { $set: { replies: doc.replies }  }, noOptOptions)
    triggerEvent('reply', 'star', Object.assign({}, reply, findSelector, {
      ratedUserId: userId,
      rating: starsCount,
      rootUserId: doc.userId
    }))
  },
  'comments/reply/remove': function (documentId, docScope, _UserData) {
    check(documentId, String)
    check(docScope, Object)

    const doc = JCommentsCollection.findOne({ _id: documentId }),
      userId = this.userId || anonUserDetected()

    let reply = {}

    if (!userId || !allowReplies(documentId)) {
      return
    }

    modifyNestedReplies(doc.replies, docScope.position, function (replies, index) {
      if (replies[index].userId === userId) {
        reply = replies[index]
        replies.splice(index, 1)
      }
    })

    const findSelector = { _id: documentId }

    JCommentsCollection.update(findSelector, { $set: { replies: doc.replies }  }, noOptOptions)
    triggerEvent('reply', 'remove', Object.assign({}, reply, findSelector, {
      rootUserId: doc.userId
    }))
  },
  'comments/count': function (referenceId) {
    check(referenceId, String)
    return JCommentsCollection.find({ referenceId: referenceId }).count()
  }
})

JJCommentsCollection.methods = {
  add: (referenceId, content) => callWithUserData('comments/add', referenceId, content),
  reply: (documentId, docScope, content) => callWithUserData('comments/reply/add', documentId, docScope, content),
  like: (documentId) => callWithUserData('comments/like', documentId),
  likeReply: (documentId, docScope) => callWithUserData('comments/reply/like', documentId, docScope),
  star: (documentId, starsCount) => callWithUserData('comments/star', documentId, starsCount),
  starReply: (documentId, docScope, starsCount) => callWithUserData('comments/reply/star', documentId, docScope, starsCount),
  edit: (documentId, newContent) => callWithUserData('comments/edit', documentId, newContent),
  editReply: (documentId, docScope, content) => callWithUserData('comments/reply/edit', documentId, docScope, content),
  remove: (documentId) => callWithUserData('comments/remove', documentId),
  removeReply: (documentId, docScope) => callWithUserData('comments/reply/remove', documentId, docScope)
}