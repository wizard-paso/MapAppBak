(function () {
  "use strict";
  function checkURL(url) {
    Debug.writeln(document.getElementById("URLinput").textContent)
    /*
    Data.checkLoadGroupFromURL(url,
      function () {
        
        callback!!
      }
      )*/
  }

  document.getElementById("addSiteButton").addEventListener("click", checkURL, false);

  Debug.writeln("tes")

})