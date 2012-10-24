// 分割テンプレートの概要については、次のドキュメントを参照してください:
// http://go.microsoft.com/fwlink/?LinkID=232447

var map;

(function () {
  "use strict";

  WinJS.Binding.optimizeBindingReferences = true;

  var app = WinJS.Application;
  var activation = Windows.ApplicationModel.Activation;
  var nav = WinJS.Navigation;

  app.addEventListener("activated", function (args) {
    if (args.detail.kind === activation.ActivationKind.launch) {
      if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
        // TODO: このアプリケーションは新しく起動しました。ここでアプリケーションを
        // 初期化します。
        Microsoft.Maps.loadModule('Microsoft.Maps.Map', {
          callback:
            function () {
              var mapOptions =
                {
                  // Add your Bing Maps key here
                  credentials: 'Ald0G_z2_H1cpKSD5Fqa59tD3RsQI6Q3XeX9CW2aGQ_jlGSeeitTykR_DmQApIKM',
                  center: new Microsoft.Maps.Location(34.397517, 132.45373),
                  mapTypeId: Microsoft.Maps.MapTypeId.road,
                  zoom: 12
                };
              map = new Microsoft.Maps.Map(document.getElementById("map"), mapOptions);
            }
        });

      } else {
        // TODO: このアプリケーションは中断状態から再度アクティブ化されました。
        // ここでアプリケーションの状態を復元します。
      }

      if (app.sessionState.history) {
        nav.history = app.sessionState.history;
      }
      args.setPromise(WinJS.UI.processAll().then(function () {
        if (nav.location) {
          nav.history.current.initialPlaceholder = true;
          return nav.navigate(nav.location, nav.state);
        } else {
          return nav.navigate(Application.navigator.home);
        }
      }));
    }
  });

  app.oncheckpoint = function (args) {
    // TODO: このアプリケーションは中断しようとしています。ここで中断中に
    // 維持する必要のある状態を保存します。アプリケーションが中断される前に 
    // 非同期操作を終了する必要がある場合は 
    // args.setPromise() を呼び出してください。
    app.sessionState.history = nav.history;
  };

  app.start();
})();
