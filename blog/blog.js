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

  function estimateReadTime(text) {
    var words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 180));
  }

  function sortPosts(posts) {
    return posts.slice().sort(function (a, b) {
      var da = parseDate(a.published_at) || new Date(0);
      var db = parseDate(b.published_at) || new Date(0);
      return db - da;
    });
  }

  function getCurrentPath() {
    return window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  }

  function normalizePostUrl(url) {
    try {
      var u = new URL(url, window.location.origin);
      return u.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    } catch (e) {
      return (url || '').replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    }
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

  function ensureFeaturedHost() {
    var host = document.getElementById('blogFeatured');
    if (host) return host;
    var section = document.getElementById('section_blog');
    if (!section) return null;
    var row = document.createElement('div');
    row.className = 'row pix-padding-top-20';
    row.innerHTML = '<div class="col-md-12"><div id="blogFeatured"></div></div>';
    var firstRow = section.querySelector('.row.pix-padding-top-30');
    if (firstRow) firstRow.parentNode.insertBefore(row, firstRow);
    return document.getElementById('blogFeatured');
  }

  function renderFeatured(post) {
    var host = ensureFeaturedHost();
    if (!host || !post) return;
    host.innerHTML = '' +
      '<article class="blog-featured">' +
        '<a class="blog-featured__media" href="' + post.url + '"><img src="' + post.cover_image + '" alt="' + post.title + '"></a>' +
        '<div class="blog-featured__body">' +
          '<span class="blog-featured__label">Doporučený článek</span>' +
          '<h3><a href="' + post.url + '">' + post.title + '</a></h3>' +
          '<p>' + (post.excerpt || '') + '</p>' +
          '<div class="blog-meta"><span class="blog-meta__badge">' + formatDate(post.published_at) + '</span><span class="blog-meta__badge">' + (post.category_label || 'Článek') + '</span></div>' +
          '<a class="blog-read-more" href="' + post.url + '">Přečíst doporučený článek →</a>' +
        '</div>' +
      '</article>';
  }

  function renderIndex(posts, categories) {
    var grid = document.getElementById('blogGrid');
    if (!grid) return;
    var select = document.getElementById('blogCategory');
    var search = document.getElementById('blogSearch');
    var empty = document.getElementById('blogEmpty');
    var count = document.getElementById('blogCount');

    if (select && categories) {
      select.innerHTML = '<option value="">Všechny kategorie</option>' + categories.map(function (cat) {
        return '<option value="' + cat.id + '">' + cat.label + '</option>';
      }).join('');
    }

    renderFeatured(sortPosts(posts)[0]);

    function filterPosts() {
      var query = (search && search.value || '').toLowerCase();
      var category = select ? select.value : '';
      var filtered = sortPosts(posts).filter(function (post) {
        var matchesCategory = !category || post.category === category;
        var matchesQuery = !query || (post.title + ' ' + (post.excerpt || '')).toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
      });

      if (count) count.textContent = 'Výsledky: ' + filtered.length + ' článků';

      if (filtered.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';

      grid.innerHTML = filtered.map(function (post) {
        var readTime = estimateReadTime((post.excerpt || '') + ' ' + (post.title || ''));
        return '' +
          '<article class="blog-card">' +
            '<a href="' + post.url + '"><img src="' + post.cover_image + '" alt="' + post.title + '"></a>' +
            '<div class="blog-card-body">' +
              '<div class="blog-meta">' +
                '<span class="blog-meta__badge">' + formatDate(post.published_at) + '</span>' +
                '<span class="blog-meta__badge">' + (post.category_label || 'Článek') + '</span>' +
                '<span class="blog-meta__badge">≈ ' + readTime + ' min čtení</span>' +
              '</div>' +
              '<h4 class="pix-navy-blue-2"><a href="' + post.url + '">' + post.title + '</a></h4>' +
              '<p class="pix-gray">' + (post.excerpt || '') + '</p>' +
              '<a class="blog-read-more" href="' + post.url + '">Číst článek →</a>' +
            '</div>' +
          '</article>';
      }).join('');
    }

    if (select) select.addEventListener('change', filterPosts);
    if (search) search.addEventListener('input', filterPosts);
    filterPosts();
  }

  function ensureProgressBar() {
    if (document.getElementById('articleProgress')) return;
    var bar = document.createElement('div');
    bar.id = 'articleProgress';
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var doc = document.documentElement;
      var total = doc.scrollHeight - window.innerHeight;
      var pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.firstElementChild.style.width = Math.min(100, Math.max(0, pct)) + '%';
    });
  }

  function enhanceArticle(posts) {
    if (window.location.pathname.indexOf('/blog') !== 0) return;
    var container = document.querySelector('div.container[style*="max-width: 920px"]');
    if (!container) return;

    ensureProgressBar();

    var current = getCurrentPath();
    var currentPost = posts.find(function (p) { return normalizePostUrl(p.url) === current; });

    var metaP = container.querySelector('p strong');
    if (metaP && currentPost) {
      var parentP = metaP.closest('p');
      if (parentP && !parentP.querySelector('.article-updated')) {
        var updated = document.createElement('span');
        updated.className = 'article-updated';
        updated.textContent = ' • Aktualizováno: ' + formatDate(currentPost.updated_at || currentPost.published_at);
        parentP.appendChild(updated);
      }
    }

    var headings = container.querySelectorAll('h2, h3');
    if (headings.length >= 3 && !document.getElementById('articleToc')) {
      var toc = document.createElement('div');
      toc.id = 'articleToc';
      toc.className = 'article-toc';
      var html = '<h4>Obsah článku</h4><ul>';
      headings.forEach(function (h, i) {
        if (!h.id) h.id = 'toc-' + i;
        html += '<li class="' + h.tagName.toLowerCase() + '"><a href="#' + h.id + '">' + h.textContent + '</a></li>';
      });
      html += '</ul>';
      toc.innerHTML = html;
      container.insertBefore(toc, container.querySelector('h1').nextSibling);
    }

    if (currentPost && !document.getElementById('relatedPosts')) {
      var related = sortPosts(posts)
        .filter(function (p) { return normalizePostUrl(p.url) !== current; })
        .filter(function (p) { return p.category === currentPost.category; })
        .slice(0, 3);
      if (related.length < 3) {
        sortPosts(posts).forEach(function (p) {
          if (related.length >= 3) return;
          if (normalizePostUrl(p.url) === current) return;
          if (related.find(function (x) { return x.url === p.url; })) return;
          related.push(p);
        });
      }

      if (related.length) {
        var box = document.createElement('section');
        box.id = 'relatedPosts';
        box.className = 'related-posts';
        box.innerHTML = '<h3>Související články</h3><div class="related-posts__grid"></div>';
        var grid = box.querySelector('.related-posts__grid');
        grid.innerHTML = related.slice(0, 3).map(function (post) {
          return '' +
            '<a class="related-post" href="' + post.url + '">' +
              '<div class="related-post__thumb" style="background-image:url(' + post.cover_image + ')"></div>' +
              '<div class="related-post__title">' + post.title + '</div>' +
            '</a>';
        }).join('');

        var blogStrip = document.getElementById('blog-strip');
        if (blogStrip && blogStrip.parentNode) {
          blogStrip.parentNode.insertBefore(box, blogStrip);
        } else {
          container.appendChild(box);
        }
      }
    }
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
        enhanceArticle(posts);
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
