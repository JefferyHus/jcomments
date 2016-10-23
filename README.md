JComments
==================
[![Build Status](https://travis-ci.org/JefferyHus/jcomments.svg?branch=master)](https://travis-ci.org/JefferyHus/jcomments)

JComments - Comments package for meteor

Description
-----------

This package is using the core of the actual package `Meteor Comments UI`, but it is using one simple template that can be eaither sued as default or replaced by creating a new template.
It does not support replies or anonymous users, it is light, fast and easy to use.

```html
<div class="comment-section">
    {{> commentsBox id=documentId}}
</div>
```

```documentId``` could be the id of a blog post, news article or a custom defined string that stands for your guestbook.

## How to install

```bash
meteor add ginsama:jcomments
```