---
title: 分类
date: 2026-03-12
layout: page
comments: false
---

<div class="category-list">
{% for category in site.categories %}
  <div class="category-item">
    <h2>
      <a href="{{ url_for(category.path) }}">
        {{ category.name }}
        <span class="category-count">({{ category.posts.length }} 篇文章)</span>
      </a>
    </h2>
    <ul class="category-post-list">
      {% for post in category.posts %}
        <li>
          <a href="{{ url_for(post.path) }}">{{ post.title }}</a>
        </li>
      {% endfor %}
    </ul>
  </div>
{% endfor %}
</div>

<style>
.category-item {
  margin-bottom: 30px;
}
.category-item h2 {
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  margin-bottom: 15px;
}
.category-count {
  font-size: 14px;
  color: #666;
  font-weight: normal;
}
.category-post-list {
  list-style: none;
  padding-left: 0;
}
.category-post-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.category-post-list li a {
  color: #333;
  text-decoration: none;
}
.category-post-list li a:hover {
  color: #007bff;
}
</style>
