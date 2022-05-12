const panelDrag = (function() {
  return {
    init: function() {
      $('#panelDrag .panel').easyDrag({
        'container': $('#map'),
        'handle': 'h3'
      });
    },
    change: (html) => {
      $('#panelDrag .panel-body').append(html);
    },
    display: () => $('#panelDrag').prop("hidden", false),
    hidden: () => $('#panelDrag').prop("hidden", true),
    clean: () => $('#panelDrag .panel-body').empty()
  };
})();

new CustomComponent("panelDrag", panelDrag.init);