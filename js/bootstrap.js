/*!
 * Bootstrap v3.4.1 - Dropdown & Collapse plugins
 * Fixed for jQuery 3.x event handler ordering
 */
+function ($) {
  'use strict';

  // ── DROPDOWN ──────────────────────────────────────────────

  var toggle = '[data-toggle="dropdown"]';

  function getParent($this) {
    var selector = $this.attr('data-target');
    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '');
    }
    var $parent = selector !== '#' ? $(document).find(selector) : null;
    return $parent && $parent.length ? $parent : $this.parent();
  }

  function clearMenus(except) {
    $(toggle).each(function () {
      var $this = $(this);
      var $parent = getParent($this);
      if (!$parent.hasClass('open')) return;
      if (except && except[0] === $parent[0]) return;
      $this.attr('aria-expanded', 'false');
      $parent.removeClass('open');
    });
  }

  // Single document click handler — avoids jQuery 3.x ordering issues
  // where separate direct + delegated handlers fire in binding order
  $(document).on('click.bs.dropdown.data-api', function (e) {
    if (e.which === 3) return; // ignore right-click

    var $clicked = $(e.target).closest(toggle);

    if ($clicked.length) {
      // Click on a dropdown toggle
      e.preventDefault();
      if ($clicked.is('.disabled, :disabled')) return;

      var $parent = getParent($clicked);
      var isActive = $parent.hasClass('open');

      // Close all other menus
      clearMenus($parent);

      if (isActive) {
        // Close this menu
        $clicked.attr('aria-expanded', 'false');
        $parent.removeClass('open');
      } else {
        // Open this menu
        $clicked.attr('aria-expanded', 'true');
        $parent.addClass('open');
      }
      return;
    }

    // Click on .dropdown form — don't close
    if ($(e.target).closest('.dropdown form').length) return;

    // Click elsewhere — close all menus
    clearMenus();
  });

  // Keyboard navigation
  $(document).on('keydown.bs.dropdown.data-api', toggle + ', .dropdown-menu', function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return;

    var $this = $(this).closest('.dropdown').find(toggle);
    e.preventDefault();
    e.stopPropagation();
    if ($this.is('.disabled, :disabled')) return;

    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');

    if (e.which === 27) {
      // Escape — close and focus toggle
      clearMenus();
      $this.trigger('focus');
      return;
    }

    if (!isActive) {
      $this.trigger('click');
      return;
    }

    var $items = $parent.find('.dropdown-menu li:not(.disabled):visible a');
    if (!$items.length) return;

    var index = $items.index(e.target);
    if (e.which === 38 && index > 0) index--;
    if (e.which === 40 && index < $items.length - 1) index++;
    if (!~index) index = 0;
    $items.eq(index).trigger('focus');
  });

  // Desktop: open dropdowns on hover
  $(document).on('mouseenter.bs.dropdown', '.pix-header-nav .dropdown', function () {
    if (window.innerWidth < 768) return;
    var $this = $(this);
    clearMenus($this);
    $this.addClass('open');
    $this.find(toggle).attr('aria-expanded', 'true');
  });

  $(document).on('mouseleave.bs.dropdown', '.pix-header-nav .dropdown', function () {
    if (window.innerWidth < 768) return;
    var $this = $(this);
    $this.removeClass('open');
    $this.find(toggle).attr('aria-expanded', 'false');
  });


  // ── COLLAPSE ──────────────────────────────────────────────

  var Collapse = function (element, options) {
    this.$element = $(element);
    this.options = $.extend({}, { toggle: true }, options);
    this.$trigger = $('[data-toggle="collapse"][data-target="#' + element.id + '"],' +
                       '[data-toggle="collapse"][href="#' + element.id + '"]');
    this.transitioning = null;
    if (this.options.toggle) this.toggle();
  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return;
    var startEvent = $.Event('show.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;
    this.$element.addClass('collapsing').removeClass('collapse');
    this.transitioning = 1;
    var complete = function () {
      this.$element.removeClass('collapsing').addClass('collapse in');
      this.$element.css('height', '');
      this.transitioning = 0;
      this.$element.trigger('shown.bs.collapse');
    };
    this.$element.css('height', 0);
    setTimeout($.proxy(complete, this), 350);
    this.$element.css('height', this.$element[0].scrollHeight);
  };

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return;
    var startEvent = $.Event('hide.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;
    this.$element.css('height', this.$element[0].scrollHeight);
    this.$element[0].offsetHeight; // force reflow
    this.$element.addClass('collapsing').removeClass('collapse in');
    this.transitioning = 1;
    var complete = function () {
      this.transitioning = 0;
      this.$element.trigger('hidden.bs.collapse').removeClass('collapsing').addClass('collapse');
    };
    this.$element.css('height', 0);
    setTimeout($.proxy(complete, this), 350);
  };

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  };

  function CollapsePlugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.collapse');
      var options = $.extend({}, typeof option === 'object' && option);
      if (!data) {
        $this.data('bs.collapse', (data = new Collapse(this, options)));
      }
      if (typeof option === 'string') data[option]();
    });
  }

  var oldCollapse = $.fn.collapse;
  $.fn.collapse = CollapsePlugin;
  $.fn.collapse.Constructor = Collapse;
  $.fn.collapse.noConflict = function () {
    $.fn.collapse = oldCollapse;
    return this;
  };

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this = $(this);
    if (!$this.attr('data-target')) e.preventDefault();
    var $target = $($this.attr('data-target') || $this.attr('href'));
    var option = $target.data('bs.collapse') ? 'toggle' : {};
    CollapsePlugin.call($target, option);
  });

}(jQuery);
