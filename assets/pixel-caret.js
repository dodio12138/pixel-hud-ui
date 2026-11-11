/*!
 * Pixel caret: a 3px block caret, a little taller than the text, for
 * <textarea> and <input> under the Pixel HUD skin. A browser caret cannot be
 * made thicker or shorter, so the field's own caret goes transparent
 * (pixel-hud.css) and this block is drawn where it would be.
 *
 * Use: put data-pixel-caret on the field and load this file; fields added
 * later are picked up too. Or call PixelCaret.attach(field) yourself (it
 * returns a detach function). The caret shows while the field has focus and
 * no selection, and only while an ancestor has data-skin="pixel".
 *
 * Plain script, no dependencies. Also an ES module export when bundled.
 */
(function (root) {
  "use strict";

  // Styles that decide where text wraps and lines fall in a field.
  var MIRRORED = [
    "boxSizing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderStyle",
    "fontFamily", "fontSize", "fontWeight", "fontStyle", "fontVariant", "fontStretch", "fontFeatureSettings",
    "letterSpacing", "wordSpacing", "lineHeight", "textTransform", "textIndent", "tabSize",
    "whiteSpace", "overflowWrap", "wordBreak",
  ];

  var mirror = null;

  function caretCoordinates(field, position) {
    if (!mirror) {
      mirror = document.createElement("div");
      mirror.setAttribute("aria-hidden", "true");
      Object.assign(mirror.style, { position: "absolute", visibility: "hidden", top: "0", left: "-9999px", overflow: "hidden" });
      document.body.appendChild(mirror);
    }
    var style = getComputedStyle(field);
    for (var i = 0; i < MIRRORED.length; i++) mirror.style[MIRRORED[i]] = style[MIRRORED[i]];
    var isInput = field.tagName === "INPUT";
    mirror.style.whiteSpace = isInput ? "pre" : "pre-wrap";
    if (!isInput) mirror.style.overflowWrap = style.overflowWrap === "normal" ? "break-word" : style.overflowWrap;
    mirror.style.boxSizing = "border-box";
    mirror.style.width = (field.clientWidth + field.clientLeft * 2) + "px";
    mirror.textContent = field.value.slice(0, position);
    var marker = document.createElement("span");
    marker.textContent = field.value.slice(position) || "​";
    mirror.appendChild(marker);
    var fontSize = parseFloat(style.fontSize) || 14;
    var lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
    // An input centers its single line in its content box.
    var inputOffset = isInput ? Math.max(0, (field.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - lineHeight) / 2) : 0;
    return {
      // Offsets count from the mirror's padding edge, as the field's content does.
      top: marker.offsetTop - field.scrollTop + inputOffset,
      left: marker.offsetLeft - field.scrollLeft,
      lineHeight: lineHeight,
      fontSize: fontSize,
    };
  }

  function attach(field) {
    if (!field || field.__pixelCaret) return field && field.__pixelCaret;
    var caret = document.createElement("span");
    caret.className = "pixel-caret";
    caret.setAttribute("aria-hidden", "true");
    var frame = 0;

    function hide() {
      if (caret.parentNode) caret.parentNode.removeChild(caret);
    }
    function place() {
      frame = 0;
      var skinned = field.closest('[data-skin="pixel"]');
      field.classList.toggle("has-pixel-caret", Boolean(skinned));
      if (!skinned || document.activeElement !== field || field.selectionStart !== field.selectionEnd) return hide();
      var at = caretCoordinates(field, field.selectionStart);
      var box = field.getBoundingClientRect();
      var height = Math.max(10, Math.round(at.fontSize * 1.25));
      var x = box.left + field.clientLeft + at.left;
      var y = box.top + field.clientTop + at.top + (at.lineHeight - height) / 2;
      if (y + height <= box.top || y >= box.bottom || x < box.left - 1 || x > box.right) return hide();
      caret.style.left = x + "px";
      caret.style.top = y + "px";
      caret.style.height = height + "px";
      // Re-inserting restarts the blink, so the caret shows solid while typing.
      hide();
      document.body.appendChild(caret);
    }
    function update() {
      if (!frame) frame = requestAnimationFrame(place);
    }

    var onField = ["input", "select", "selectionchange", "keydown", "keyup", "mouseup", "focus", "blur", "scroll"];
    onField.forEach(function (type) { field.addEventListener(type, update); });
    document.addEventListener("selectionchange", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    var resize = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    if (resize) resize.observe(field);
    update();

    function detach() {
      if (frame) cancelAnimationFrame(frame);
      onField.forEach(function (type) { field.removeEventListener(type, update); });
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      if (resize) resize.disconnect();
      field.classList.remove("has-pixel-caret");
      hide();
      delete field.__pixelCaret;
    }
    // Lets a framework re-place it after it sets the value itself.
    detach.update = update;
    field.__pixelCaret = detach;
    return detach;
  }

  function attachAll(scope) {
    var fields = (scope || document).querySelectorAll("textarea[data-pixel-caret], input[data-pixel-caret]");
    for (var i = 0; i < fields.length; i++) attach(fields[i]);
  }

  function autoInit() {
    attachAll(document);
    if (typeof MutationObserver !== "function") return;
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.matches && node.matches("textarea[data-pixel-caret], input[data-pixel-caret]")) attach(node);
          else if (node.querySelectorAll) attachAll(node);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  var api = { attach: attach, attachAll: attachAll };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.PixelCaret = api;
    if (root.document) {
      if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", autoInit);
      else autoInit();
    }
  }
})(typeof window !== "undefined" ? window : null);
