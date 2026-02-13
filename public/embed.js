(function () {
  'use strict';

  // ----------------------------------------------------------------
  // Utility helpers
  // ----------------------------------------------------------------
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (_) {
      return '';
    }
  }

  function getBaseUrl() {
    var scripts = document.querySelectorAll('script[data-widget-id]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src) {
        try {
          var url = new URL(src, window.location.href);
          return url.origin;
        } catch (_) {}
      }
    }
    return '';
  }

  // ----------------------------------------------------------------
  // Styles (scoped inside shadow DOM)
  // ----------------------------------------------------------------
  function getStyles(config) {
    var isLight = config.theme === 'light';
    var bg = isLight ? '#ffffff' : '#1a1a2e';
    var cardBg = isLight ? '#f8fafc' : '#0f172a';
    var textColor = isLight ? '#1e293b' : '#e2e8f0';
    var mutedColor = isLight ? '#64748b' : '#94a3b8';
    var borderColor = isLight ? '#e2e8f0' : '#1e293b';
    var avatarBg = isLight ? '#e0e7ff' : '#312e81';
    var avatarColor = isLight ? '#4338ca' : '#a5b4fc';
    var cols = config.columns || 3;

    return '\
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\
      :host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }\
      .tg-container { background: ' + bg + '; color: ' + textColor + '; padding: 24px; border-radius: 12px; }\
      .tg-wall { display: grid; grid-template-columns: repeat(' + cols + ', 1fr); gap: 16px; }\
      .tg-carousel { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 8px; }\
      .tg-carousel::-webkit-scrollbar { height: 6px; }\
      .tg-carousel::-webkit-scrollbar-track { background: ' + borderColor + '; border-radius: 3px; }\
      .tg-carousel::-webkit-scrollbar-thumb { background: ' + mutedColor + '; border-radius: 3px; }\
      .tg-carousel .tg-card { min-width: 300px; max-width: 340px; flex-shrink: 0; scroll-snap-align: start; }\
      .tg-badge-wrap { max-width: 400px; }\
      .tg-card { background: ' + cardBg + '; border: 1px solid ' + borderColor + '; border-radius: 8px; padding: 20px; transition: box-shadow 0.2s; }\
      .tg-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }\
      .tg-stars { display: flex; gap: 2px; margin-bottom: 12px; }\
      .tg-star { width: 16px; height: 16px; }\
      .tg-star-filled { color: #facc15; }\
      .tg-star-empty { color: ' + (isLight ? '#cbd5e1' : '#475569') + '; }\
      .tg-content { font-size: 14px; line-height: 1.6; margin-bottom: 16px; color: ' + textColor + '; }\
      .tg-author { display: flex; align-items: center; gap: 10px; }\
      .tg-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; background: ' + avatarBg + '; color: ' + avatarColor + '; flex-shrink: 0; }\
      .tg-author-info { display: flex; flex-direction: column; }\
      .tg-author-name { font-size: 14px; font-weight: 600; line-height: 1.3; }\
      .tg-author-company { font-size: 12px; color: ' + mutedColor + '; }\
      .tg-date { font-size: 11px; color: ' + mutedColor + '; margin-top: 12px; }\
      .tg-footer { text-align: center; padding-top: 16px; margin-top: 20px; border-top: 1px solid ' + borderColor + '; }\
      .tg-footer a { font-size: 12px; color: ' + mutedColor + '; text-decoration: none; }\
      .tg-footer a:hover { text-decoration: underline; }\
      @media (max-width: 768px) {\
        .tg-wall { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }\
        .tg-carousel .tg-card { min-width: 260px; }\
      }\
      @media (max-width: 480px) {\
        .tg-wall { grid-template-columns: 1fr; }\
        .tg-container { padding: 16px; }\
      }\
    ';
  }

  // ----------------------------------------------------------------
  // Star SVG rendering
  // ----------------------------------------------------------------
  function starSvg(filled) {
    var fill = filled ? 'currentColor' : 'none';
    return '<svg class="tg-star ' + (filled ? 'tg-star-filled' : 'tg-star-empty') + '" viewBox="0 0 24 24" fill="' + fill + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
  }

  function renderStars(rating) {
    if (rating === null || rating === undefined) return '';
    var html = '<div class="tg-stars">';
    for (var i = 0; i < 5; i++) {
      html += starSvg(i < rating);
    }
    html += '</div>';
    return html;
  }

  // ----------------------------------------------------------------
  // Card rendering
  // ----------------------------------------------------------------
  function renderCard(t, config) {
    var html = '<div class="tg-card">';

    if (config.show_rating && t.rating !== null && t.rating !== undefined) {
      html += renderStars(t.rating);
    }

    html += '<div class="tg-content">&ldquo;' + escapeHtml(t.content) + '&rdquo;</div>';

    html += '<div class="tg-author">';
    if (config.show_avatar) {
      var initial = (t.author_name || '?').charAt(0).toUpperCase();
      html += '<div class="tg-avatar">' + escapeHtml(initial) + '</div>';
    }
    html += '<div class="tg-author-info">';
    html += '<span class="tg-author-name">' + escapeHtml(t.author_name || 'Anonymous') + '</span>';
    if (t.author_company) {
      html += '<span class="tg-author-company">' + escapeHtml(t.author_company) + '</span>';
    }
    html += '</div></div>';

    if (config.show_date && t.created_at) {
      html += '<div class="tg-date">' + escapeHtml(formatDate(t.created_at)) + '</div>';
    }

    html += '</div>';
    return html;
  }

  // ----------------------------------------------------------------
  // Widget rendering
  // ----------------------------------------------------------------
  function renderWidget(container, data) {
    var widget = data.widget;
    var testimonials = data.testimonials || [];
    var config = widget.config || {};
    var type = widget.type || 'wall';
    var maxItems = config.max_items || 12;

    // Limit testimonials
    var items = testimonials.slice(0, maxItems);
    if (items.length === 0) return;

    // Create shadow DOM
    var shadow = container.attachShadow
      ? container.attachShadow({ mode: 'open' })
      : container;

    var style = document.createElement('style');
    style.textContent = getStyles(config);

    var wrapper = document.createElement('div');
    wrapper.className = 'tg-container';

    var html = '';

    if (type === 'wall') {
      html += '<div class="tg-wall">';
      for (var i = 0; i < items.length; i++) {
        html += renderCard(items[i], config);
      }
      html += '</div>';
    } else if (type === 'carousel') {
      html += '<div class="tg-carousel">';
      for (var j = 0; j < items.length; j++) {
        html += renderCard(items[j], config);
      }
      html += '</div>';
    } else if (type === 'badge') {
      html += '<div class="tg-badge-wrap">';
      html += renderCard(items[0], config);
      html += '</div>';
    }

    // Powered by footer
    html += '<div class="tg-footer">';
    html += '<a href="https://testispark.com" target="_blank" rel="noopener noreferrer">Powered by TestiSpark</a>';
    html += '</div>';

    wrapper.innerHTML = html;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
  }

  // ----------------------------------------------------------------
  // Initialization
  // ----------------------------------------------------------------
  function init() {
    var baseUrl = getBaseUrl();

    // Find all script tags with data-widget-id
    var scripts = document.querySelectorAll('script[data-widget-id]');

    for (var i = 0; i < scripts.length; i++) {
      (function (scriptEl) {
        var widgetId = scriptEl.getAttribute('data-widget-id');
        if (!widgetId) return;

        // Find the target container - look for next sibling div with id testiSpark-widget,
        // or create one after the script tag
        var target = null;

        // Check next sibling elements
        var sibling = scriptEl.nextElementSibling;
        while (sibling) {
          if (
            sibling.id === 'testiSpark-widget' ||
            sibling.getAttribute('data-testiSpark-target') === widgetId
          ) {
            target = sibling;
            break;
          }
          sibling = sibling.nextElementSibling;
        }

        // If no target found, also check by id
        if (!target) {
          target = document.getElementById('testiSpark-widget');
        }

        // If still no target, create one
        if (!target) {
          target = document.createElement('div');
          target.id = 'testiSpark-widget';
          scriptEl.parentNode.insertBefore(target, scriptEl.nextSibling);
        }

        // Avoid double-rendering
        if (target.getAttribute('data-tg-rendered')) return;
        target.setAttribute('data-tg-rendered', 'true');

        // Fetch and render
        var apiUrl = baseUrl + '/api/embed/' + encodeURIComponent(widgetId);

        fetch(apiUrl)
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then(function (data) {
            if (data && data.widget) {
              renderWidget(target, data);
            }
          })
          .catch(function (err) {
            // Fail silently - show nothing if API fails
            if (typeof console !== 'undefined' && console.error) {
              console.error('TestiSpark: Failed to load widget', err);
            }
          });
      })(scripts[i]);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
