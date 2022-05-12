
const panelDrag = (function () {
    
    return {
        
        init: function () {
          $('#panelDrag .panel').easyDrag(
            {'container': $('#map'),
            'handle': 'h3'
            }
          );
            
        }
    };

})();

new CustomComponent("panelDrag", panelDrag.init);
