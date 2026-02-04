(function () {
  var indexUrl = '/blog/index.json';

  function parseDate(value) {
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(value) {
    var d = parseDate(value);
    if (!d) return '';
    return d.toLocaleDateString('cs-CZ');
  }

  function sortPosts(posts) {
    return posts.slice().sort(function (a, b) {
      var da = parseDate(a.published_at) || new Date(0);
      var db = parseDate(b.published_at) || new Date(0);
      return db - da;
    });
  }

  function renderStrip(posts) {
    var strip = document.getElementById('blog-strip');
    if (!strip) return;
    var items = sortPosts(posts).slice(0, 3);
    var list = strip.querySelector('.blog-strip__list');
    if (!list) return;
    if (items.length === 0) {
      list.innerHTML = '<div class="blog-strip__empty">Nové články připravujeme.</div>';
      return;
    }
    list.innerHTML = items.map(function (post) {
      return '' +
        '<a class="blog-strip__item" href="' + post.url + '">' +
          '<div class="blog-strip__thumb" style="background-image:url(' + post.cover_image + ')"></div>' +
          '<div class="blog-strip__title">' + post.title + '</div>' +
          '<div class="blog-strip__meta">' + formatDate(post.published_at) + '</div>' +
        '</a>';
    }).join('');
  }

  function renderIndex(posts, categories) {
    var grid = document.getElementById('blogGrid');
    if (!grid) return;
    var select = document.getElementById('blogCategory');
    var search = document.getElementById('blogSearch');
    var empty = document.getElementById('blogEmpty');
    if (select && categories) {
      select.innerHTML = '<option value="">Všechny kategorie</option>' + categories.map(function (cat) {
        return '<option value="' + cat.id + '">' + cat.label + '</option>';
      }).join('');
    }

    function filterPosts() {
      var query = (search && search.value || '').toLowerCase();
      var category = select ? select.value : '';
      var filtered = sortPosts(posts).filter(function (post) {
        var matchesCategory = !category || post.category === category;
        var matchesQuery = !query || (post.title + ' ' + (post.excerpt || '')).toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      grid.innerHTML = filtered.map(function (post) {
        return '' +
          '<div class="blog-card">' +
            '<a href="' + post.url + '"><img src="' + post.cover_image + '" alt="' + post.title + '"></a>' +
            '<div class="blog-card-body">' +
              '<div class="blog-meta">' + formatDate(post.published_at) + ' • ' + (post.category_label || '') + '</div>' +
              '<h4 class="pix-navy-blue-2"><a href="' + post.url + '">' + post.title + '</a></h4>' +
              '<p class="pix-gray">' + (post.excerpt || '') + '</p>' +
            '</div>' +
          '</div>';
      }).join('');
    }

    if (select) select.addEventListener('change', filterPosts);
    if (search) search.addEventListener('input', filterPosts);
    filterPosts();
  }

  function init() {
    fetch(indexUrl, { cache: 'no-store' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var categories = data.categories || [];
        var posts = (data.posts || []).map(function (post) {
          var category = categories.find(function (cat) { return cat.id === post.category; });
          return Object.assign({}, post, {
            category_label: category ? category.label : (post.category || '')
          });
        });
        renderStrip(posts);
        renderIndex(posts, categories);
      })
      .catch(function () {
        renderStrip([]);
        var grid = document.getElementById('blogGrid');
        if (grid) grid.innerHTML = '';
        var empty = document.getElementById('blogEmpty');
        if (empty) empty.style.display = 'block';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
