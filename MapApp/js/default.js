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
        loadModules( 
            function () {
              var mapOptions =
                {
                  // Add your Bing Maps key here
                  credentials: 'Ald0G_z2_H1cpKSD5Fqa59tD3RsQI6Q3XeX9CW2aGQ_jlGSeeitTykR_DmQApIKM',
                  center: new Microsoft.Maps.Location(34.397517, 132.45373),
                  mapTypeId: Microsoft.Maps.MapTypeId.road,
                  zoom: 12,
                  theme: new Microsoft.Maps.Themes.BingTheme()
                };
              map = new Microsoft.Maps.Map(document.getElementById("map"), mapOptions);
              loadContents();
            }, 'Microsoft.Maps.Map', 'Microsoft.Maps.Themes.BingTheme'
        );

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
  function loadModules(callback) {//引数にコールバックとロードするモジュールをとる

    var loadedModuleCount = 0;  //ロードし終えたモジュールのカウンタ
    var i //カウンタ
    try{
      for (i = 1; i < arguments.length; i++) {
         Microsoft.Maps.loadModule(arguments[i],{callback:complete})//ロードしていく
      } 
    } catch (e) {//ロードエラーが発生した場合、
      var md = new Windows.UI.Popups.MessageDialog(e.message +"["+i+"]");
      md.showAsync();
      return i;
    }

    /*var loadedModuleCount = 0;  //ロードし終えたモジュールのカウンタ
    Microsoft.Maps.loadModule('Microsoft.Maps.Map',{callback:complete});
    Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: complete });*/

    function complete(){  //ロードのモジュールを終えるごとに呼び出される関数
      if(loadedModuleCount>arguments.length-2){  //すべてのモジュールをロードし終えたらコールバックを実行
        callback()
      }
    }

  }

  function loadContents() {

    var tmpBackgroundImage= "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"

    /* 読み込むイベントデータの設定 */
    var eventAPIPages = [
        { key: "Atnd", title: "Atnd", subtitle: "Group Subtitle: 1", backgroundImage: tmpBackgroundImage, description: "Atndだよ", url: "http://api.atnd.org/events/?keyword_or=google,cloud&format=json&count=10", func: funcAtnd },
        { key: "kokucheese", title: "こくちーず", subtitle: "Group Subtitle: 2", backgroundImage: tmpBackgroundImage, description: "こくちーずよ", url: "http://azusaar.appspot.com/api/kokucheese?count=10", func: funcAtnd },
        { key: "partake", title: "partake", subtitle: "Group Subtitle: 3", backgroundImage: tmpBackgroundImage, description: "ぱたけ", url: "http://azusaar.appspot.com/api/partake?count=10", func: funcAtnd },
        { key: "zusaar", title: "zusaar", subtitle: "Group Subtitle: 4", backgroundImage: tmpBackgroundImage, description: "ずさー", url: "http://azusaar.appspot.com/api/zusaar?count=10", func: funcAtnd }
    ];

    /* イベントデータの処理方法 Atnd & Azusaar */
    function funcAtnd(group,receivedData) {

      var jsonData = JSON.parse(receivedData.response);
      
      ((jsonData["event"]) ? jsonData["event"] : jsonData["events"]).forEach(function (eventData) {
        
        checkData({group:group, title:eventData.title, subtitle:"subtitle", description:eventData.event_url, content:"", backgroundImage:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC", lat:eventData.lat, lon:eventData.lon });
      })
    }

    function checkData(data) {
      //data.forEach(function (value) { })
      if (!data.group) {
        return
      }
      setItem(data);
    }

    function setItem(formattedData) {
      /* if lon len undefined... */

      Data.items.push({
        group: formattedData.group, title: formattedData.title, subtitle: formattedData.subtitle, description: formattedData.description, content: formattedData.content,
        backgroundImage: formattedData.backgroundImage
      });

      var pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(formattedData.lat, formattedData.lon), null);
      map.entities.push(pushpin);

      var infobox = new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(formattedData.lat, formattedData.lon), {
        height: 100,
        title: formattedData.title,
        description: formattedData.description,
        titleClickHandler: function () {

        },
        pushpin: pushpin
      });

      map.entities.push(infobox);
    }

    eventAPIPages.forEach(function (group) {
     // var tmpItem=item
      WinJS.xhr({ url: group.url }).done(function complete(receivedData) {
        //Debug.writeln(JSON.parse(value.response)["event"][0]["address"]);

        group.func(group,receivedData);



      });
    });
    //addSite();
  }


  function addSite(obj) {
  }

  app.start();
})();
