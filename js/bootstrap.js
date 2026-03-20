/*!
 * Bootstrap v3.4.1 - Dropdown Plugin (minimal)
 * Compatible with jQuery 3.x
 */
+function ($) {
  'use strict';

  // DROPDOWN CLASS
  var backdrop = '.dropdown-backdrop';
  var toggle   = '[data-toggle="dropdown"]';
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle);
  };

  function getParent($this) {
    var selector = $this.attr('data-target');
    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '');
    }
    var $parent = selector !== '#' ? $(document).find(selector) : null;
    return $parent && $parent.length ? $parent : $this.parent();
  }

  function clearMenus(e) {
    if (e && e.which === 3) return;
    $(backdrop).remove();
    $(toggle).each(function () {
      var $this = $(this);
      var $parent = getParent($this);
      var relatedTarget = { relatedTarget: this };
      if (!$parent.hasClass('open')) return;
      if (e && e.type === 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return;
      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));
      if (e.isDefaultPrevented()) return;
      $this.attr('aria-expanded', 'false');
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget));
    });
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this);
    if ($this.is('.disabled, :disabled')) return;
    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');
    clearMenus();
    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        $(document.createElement('div'))
          .addClass('dropdown-backdrop')
          .insertAfter($(this))
          .on('click', clearMenus);
      }
      var relatedTarget = { relatedTarget: this };
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));
      if (e.isDefaultPrevented()) return;
      $this.trigger('focus').attr('aria-expanded', 'true');
      $parent.toggleClass('open').trigger($.Event('shown.bs.dropdown', relatedTarget));
    }
    return false;
  };

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return;
    var $this = $(this);
    e.preventDefault();
    e.stopPropagation();
    if ($this.is('.disabled, :disabled')) return;
    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');
    if (!isActive && e.which !== 27 || isActive && e.which === 27) {
      if (e.which === 27) $parent.find(toggle).trigger('focus');
      return $this.trigger('click');
    }
    var desc = ' li:not(.disabled):visible a';
    var $items = $parent.find('.dropdown-menu' + desc);
    if (!$items.length) return;
    var index = $items.index(e.target);
    if (e.which === 38 && index > 0) index--;
    if (e.which === 40 && index < $items.length - 1) index++;
    if (!~index) index = 0;
    $items.eq(index).trigger('focus');
  };

  // DROPDOWN PLUGIN
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.dropdown');
      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)));
      if (typeof option === 'string') data[option].call($this);
    });
  }

  var old = $.fn.dropdown;
  $.fn.dropdown = Plugin;
  $.fn.dropdown.Constructor = Dropdown;
  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old;
    return this;
  };

  // APPLY TO DOM
  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation(); })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown);

  // COLLAPSE CLASS (for mobile nav)
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
