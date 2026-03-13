---
title: 标签
date: 2026-03-12
layout: page
comments: false
---

<div class="tag-list">
{% for tag in site.tags %}
  <div class="tag-item">
    <h3>
      <a href="{{ url_for(tag.path) }}">
        {{ tag.name }}
        <span class="tag-count">({{ tag.posts.length }} 篇文章)</span>
      </a>
    </h3>
    <ul class="tag-post-list">
      {% for post in tag.posts %}
        <li>
          <a href="{{ url_for(post.path) }}">{{ post.title }}</a>
        </li>
      {% endfor %}
    </ul>
  </div>
{% endfor %}
</div>

<style>
.tag-item {
  margin-bottom: 25px;
}
.tag-item h3 {
  border-bottom: 2px solid #28a745;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.tag-count {
  font-size: 13px;
  color: #666;
  font-weight: normal;
}
.tag-post-list {
  list-style: none;
  padding-left: 0;
}
.tag-post-list li {
  padding: 6px 0;
  display: inline-block;
  margin-right: 15px;
}
.tag-post-list li a {
  color: #333;
  text-decoration: none;
}
.tag-post-list li a:hover {
  color: #28a745;
}
</style>
