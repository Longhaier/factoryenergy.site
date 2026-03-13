---
title: Home
date: 2026-03-13
layout: page
comments: false
language: en
---

{% raw %}
<script>
document.addEventListener('DOMContentLoaded', function() {
  if (location.pathname.indexOf('/en') > -1 || location.pathname === '/en') {
    var items = document.querySelectorAll('.nav-item a');
    var texts = ['Home', 'About', 'Categories', 'Tags', 'Search', '中文'];
    items.forEach(function(item, i) { if (texts[i]) item.textContent = texts[i]; });
  }
});
</script>
{% endraw %}

# Welcome to Factory Energy Management
