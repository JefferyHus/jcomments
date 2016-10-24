import ClassMedia from './exports/media'
import imageAnalyzer from './exports/media-analyzers/image'
import linkAnalyzer from './exports/media-analyzers/link'
import ClassUser from './exports/user'

const {
  add,
  remove,
  edit,
  like,
  star
} = JCommentsCollection.methods

JComments = {
  config: (function () {
    let config = {
      rating: 'likes',
      mediaAnalyzers: [imageAnalyzer, linkAnalyzer],
      publishUserFields: { profile: 1, emails: 1, username: 1 },
      onEvent: () => {},
      sortingOptions: [
        { value: 'newest', label: 'Newest', sortSpecifier: { createdAt: -1 } },
        { value: 'oldest', label: 'Oldest', sortSpecifier: { createdAt: 1 } },
        { value: 'rating', label: 'Best rating', sortSpecifier: { ratingScore: -1 } }
      ]
    }

    return (newConfig) => {
      if (!newConfig) {
        return config
      }

      config = _.extend(config, newConfig)
    }
  })(),
  get: (id, sorting = null) => {
    if (!sorting) {
      sorting = { createdAt: -1 }
    }

    return JCommentsCollection.find({ referenceId: id }, { sort: sorting })
  },
  getOne: (id) => JCommentsCollection.findOne({ _id: id }),
  getAll: () => JCommentsCollection.find({}, { sort: { createdAt: -1 } }),
  add,
  remove,
  edit,
  like,
  star,
  session: new ReactiveDict('jComment'),
  changeSchema: function (cb) {
    var currentSchema = JCommentsCollection.simpleSchema().schema(),
      callbackResult = cb(currentSchema),
      newSchema

    newSchema = callbackResult ? callbackResult : currentSchema
    !!newSchema && JCommentsCollection.attachSchema(newSchema, { replace: true })
  },
  getCount: (id, cb) => Meteor.call('comments/count', id, cb),
  analyzers: {
    image: imageAnalyzer,
    link: linkAnalyzer
  },
  getCollection: () => JCommentsCollection,
  getSortOption: (sorting) => {
    const options = _.filter(JComments.config().sortingOptions, (option) => option.value === sorting)

    if (0 === options.length) {
      throw new Meteor.Error('Invalid sorting specified')
    }

    return options[0].sortSpecifier
  },
  _collection: JCommentsCollection,
  _ClassMedia: ClassMedia
}

if (Meteor.isClient) {
  JComments.ui = (function () {
    let config = {
      limit: 5,
      loadMoreCount: 10,
      template: 'material',
      defaultAvatar:'http://s3.amazonaws.com/37assets/svn/765-default-avatar.png',
      markdown: false
    }

    return {
      config: function (newConfig) {
        if (!newConfig) {
          return config
        }

        config = _.extend(config, newConfig)
      },
      setContent: (content) => JComments.session.set('content', content),
      callIfLoggedIn: function (action, cb) {
        if (!ClassUser.getUserId()) {
          JComments.session.set('loginAction', action)
        } else {
          return cb()
        }
      },
      getSorting: function (id) {
        return JComments.session.get(id + '_sorting')
      }
    }
  })()
}
