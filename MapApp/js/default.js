// 分割テンプレートの概要については、次のドキュメントを参照してください:
// http://go.microsoft.com/fwlink/?LinkID=232447

var map;

(function () {
  "use strict";

  WinJS.Binding.optimizeBindingReferences = true;

  var app = WinJS.Application;
  var activation = Windows.ApplicationModel.Activation;
  var nav = WinJS.Navigation;
  var searchManager;

  app.addEventListener("activated", function (args) {
    if (args.detail.kind === activation.ActivationKind.launch) {
      if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
        // TODO: このアプリケーションは新しく起動しました。ここでアプリケーションを
        // 初期化します。
        var modules=['Microsoft.Maps.Search', 'Microsoft.Maps.Map', 'Microsoft.Maps.Themes.BingTheme']
        var promises = modules.map(function (module) {
          return Microsoft.Maps.loadModule(module)
        });

        WinJS.Promise.join(promises).then(function () {
          Debug.writeln("finished");
          var mapOptions =
  {
    credentials: 'Ald0G_z2_H1cpKSD5Fqa59tD3RsQI6Q3XeX9CW2aGQ_jlGSeeitTykR_DmQApIKM',
    center: new Microsoft.Maps.Location(34.397517, 132.45373),
    mapTypeId: Microsoft.Maps.MapTypeId.road,
    zoom: 12,
    theme: new Microsoft.Maps.Themes.BingTheme(),
    enableSearchLogo: false,
    enableClickableLogo: false,
    showDashboard: false
  };
          map = new Microsoft.Maps.Map(document.getElementById("map"), mapOptions);
          map.addComponent("searchManager", new Microsoft.Maps.Search.SearchManager(map));
          searchManager = map.getComponent("searchManager");

          /* のちにBingMapのPinをinvokeするために、IDを抽出しておく */
          map.entities.bingEventID = Object.getOwnPropertyNames(map.entities).toString().match(/cm[0-9]+_er_thr/m)[0]

          loadContents();
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

  function loadContents() {

    var tmpBackgroundImage= "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"

    /* 読み込むイベントデータの設定 */
    var eventAPIPages = [
        { key: "Atnd", title: "Atnd", subtitle: "Group Subtitle: 1", backgroundImage: "/images/atnd.png", description: "Atndだよ", url: "http://api.atnd.org/events/?keyword_or=google,cloud&format=json&count=1", func: funcAtnd },
        { key: "kokucheese", title: "こくちーず", subtitle: "Group Subtitle: 2", backgroundImage: "/images/kokucheese.gif", description: "こくちーずよ", url: "http://azusaar.appspot.com/api/kokucheese?count=1", func: funcAtnd },
        { key: "partake", title: "partake", subtitle: "Group Subtitle: 3", backgroundImage: tmpBackgroundImage, description: "ぱたけ", url: "http://azusaar.appspot.com/api/partake?count=1", func: funcAtnd },
        { key: "zusaar", title: "zusaar", subtitle: "Group Subtitle: 4", backgroundImage: tmpBackgroundImage, description: "ずさー", url: "http://azusaar.appspot.com/api/zusaar?count=1", func: funcAtnd }
    ];

    /* イベントデータの処理方法 Atnd & Azusaar */
    function funcAtnd(group,receivedData) {

      var jsonData = JSON.parse(receivedData.response);
      
      ((jsonData["event"]) ? jsonData["event"] : jsonData["events"]).forEach(function (eventData) {
        
        checkData({ group: group, title: eventData.title, subtitle: (eventData.address ? eventData.address+" " : "") + (eventData.place ? eventData.place : ""), description: eventData.event_url, content: "", backgroundImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC", lat: eventData.lat, lon: eventData.lon, address: eventData.address });
      })
    }

    function checkData(data) {
      //data.forEach(function (value) { })
      if (!data.group) {
        return
      }
      if ((data.lat == undefined || data.lon == undefined)&&data.address) {
        var tmpData = data;
        getLatLon(tmpData.address,
          function (result) {
            //var topResult = ;
            if (result.results[0]) {
              tmpData.lat = result.results[0].location.latitude;
              tmpData.lon = result.results[0].location.longitude;
              setItem(tmpData);
            } else {
              setItem(tmpData);
            }

          },
          function () {return});
      } else {
        setItem(data);
      }
      
    }
    // geocode api request
    function getLatLon(word, onSuccess,onFailed) {
      var where = word;

      var request =
      {
        where: where,
        count: 1,
        callback: onSuccess,
        errorCallback: onFailed
      };
      searchManager.geocode(request);
    }

    function setItem(formattedData) {

      var pushpin = null;

      if (formattedData.lat != undefined && formattedData.lon != undefined) {
        pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(formattedData.lat, formattedData.lon), null);
        pushpin.setOptions({
          icon: 10
        });
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

      Data.items.push({
        group: formattedData.group, title: formattedData.title, subtitle: formattedData.subtitle, description: formattedData.description, content: formattedData.content,
        backgroundImage: formattedData.backgroundImage,pushpin:pushpin  //pushpin 参照を渡す
        });

    }

    eventAPIPages.forEach(function (group) {
      var tmpGroup = group;
      WinJS.xhr({ url: tmpGroup.url }).done(function complete(receivedData) {

        group.func(tmpGroup,receivedData);



      });
    });
  }
  app.start();
})();
