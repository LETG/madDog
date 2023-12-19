const panelDrag = (function() {
  return {
    init: function() {
      $('#panelDrag .panel').easyDrag({
        container: $('#map'),
        handle: 'h3',
        stop: (e) => {
          const navBarClientInfos = document.querySelector("#mv-navbar").getBoundingClientRect();
          const panelDragClientInfos = document.querySelector("#panelDrag .panel").getBoundingClientRect();
          let minYNavBar = navBarClientInfos.height + navBarClientInfos.top;
          let isUnderNavbar = panelDragClientInfos.top < minYNavBar;
          if (isUnderNavbar) {
            document.querySelector("#panelDrag .panel").style.top = "5px";
          }
        }
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
