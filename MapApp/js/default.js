// 分割テンプレートの概要については、次のドキュメントを参照してください:
// http://go.microsoft.com/fwlink/?LinkID=232447

var map;
var searchManager;

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
          callback: function () {
            var modules = ['Microsoft.Maps.Search', 'Microsoft.Maps.Themes.BingTheme']
            var promises = modules.map(function (module) {
              return Microsoft.Maps.loadModule(module)
            });

            WinJS.Promise.join(promises).then(function () {
              Debug.writeln("finished");
              var mapOptions =
      {
        credentials: "Ald0G_z2_H1cpKSD5Fqa59tD3RsQI6Q3XeX9CW2aGQ_jlGSeeitTykR_DmQApIKM",//"AjytWVJatD84WDxpFKi8RChPNo2-CpSk_ImbnlmI50zNyIx9TI-wYRoaZ8Df8FSL",//'Ald0G_z2_H1cpKSD5Fqa59tD3RsQI6Q3XeX9CW2aGQ_jlGSeeitTykR_DmQApIKM',
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

              //loadContents();
              initialize();
              //Data.loadGroupFromURL("http://api.atnd.org/events/?keyword_or=google,cloud&format=json&count=1");
              StorageData.loadURLData();
            });
          }
          })



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
  /*チャームに追加設定を配置する*/
  app.onsettings = function (e) {
    e.detail.applicationcommands = { "addSite": { title: "サイトを追加する", href: "/pages/charm/addSite.html" },"settings": { title: "設定", href: "/pages/charm/settings.html" } };
    WinJS.UI.SettingsFlyout.populateSettings(e);
  };

  app.oncheckpoint = function (args) {
    // TODO: このアプリケーションは中断しようとしています。ここで中断中に
    // 維持する必要のある状態を保存します。アプリケーションが中断される前に 
    // 非同期操作を終了する必要がある場合は 
    // args.setPromise() を呼び出してください。
    app.sessionState.history = nav.history;
  };
  function initialize() {

    document.getElementById("changeMapButton").addEventListener("click", clickChangeMap, false);
    document.getElementById("changeImageButton").addEventListener("click", clickChangeImage, false);
    document.getElementById("deleteItemButton").addEventListener("click", clickDeleteItem, false);
    document.getElementById("refreshButton").addEventListener("click", refreshItem, false);
    function refreshItem() {
      //var a = document.getElementById("listView").winControl
      if (nav.location == "/pages/items/items.html") {
        Data.refreshItem();
      }
      
      
    }

    function clickChangeMap() {
      if (map.getMapTypeId() == Microsoft.Maps.MapTypeId.road) {
        map.setMapType(Microsoft.Maps.MapTypeId.aerial);
        document.getElementById("changeMapButton").winControl.label = '道路';
      } else {
        map.setMapType(Microsoft.Maps.MapTypeId.road);
        document.getElementById("changeMapButton").winControl.label = '航空写真';
      }
    }

    function clickDeleteItem(event) {
      var listView = document.getElementById("listView").winControl
      var selectedItems = listView.selection.getItems()
      var items = listView.selection.getItems()
      var group = Data.resolveGroupReference(items._value[0].key)

      if (listView.selection.count() == 1) {
        var msg = new Windows.UI.Popups.MessageDialog(group.title + "を削除します。");

        msg.commands.append(new Windows.UI.Popups.UICommand("削除", deleteItem));
        msg.commands.append(new Windows.UI.Popups.UICommand("キャンセル"));

        msg.defaultCommandIndex = 1;
        msg.cancelCommandIndex = 1;
        msg.showAsync();
      }

      function deleteItem() {
        Data.deleteGroup(group)
      }
    }
    function clickChangeImage(event) {
      var listView = document.getElementById("listView").winControl
      var selectedItems = listView.selection.getItems()

      if (listView.selection.count() == 1) {

        var items = listView.selection.getItems()
        Debug.writeln(items._value[0].key)
        loadImage(Data.resolveGroupReference(items._value[0].key));


      }

      //ファイルピッカーを用いてグループ画像をロードする
      function loadImage(group) {

        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.fileTypeFilter.replaceAll([".jpg", ".bmp", ".gif", ".png"]);
        picker.pickSingleFileAsync().then(processResults, displayError);

        function processResults(file) {


          // Check that the picker returned a file. 
          // The picker returns null if the user clicked Cancel.
          if (file) {
            Data.setGroupImage(group, file)
            StorageData.saveImage(group, file)

            //var localStorage = WinJS.Application.local;
            //localStorage.
            //elements["imageControl"].src = imageBlob;


            //elements["imageInformation"].innerText =          "The src of the first image has been set to " + file.name;

            // Release the blob resources.
            //URL.revokeObjectURL(imageBlob);
          } else {
            // elements["imageInformation"].innerText = "An image wasn't selected.";
          }
          function copySucceeded(iAsyncAction) {
            Debug.writeln(iAsyncAction.path + "を作成しました。");
            /*var p = document.createElement('p')
            p.innerText = "[ " + iAsyncAction.path + " ]を作成しました。"
            element.querySelector("#output").appendChild(p);*/
          }

        }
        function displayError(error) {
          if (imageBlob) {
            URL.revokeObjectURL(imageBlob);
          }
          //document.getElementById("imageInformation").innerText = error;
        }
      }
    }

  }
  app.start();

  WinJS.Namespace.define("Utility", {
    checkURL: checkURL,
    changeAppTitle: changeAppTitle,
    createHash: createHash,
    //initDeleteFlyout: initDeleteFlyout,
    //deleteURL: deleteURL
  })
  function getElements(node) {
    var elements = new Array();
    for (var i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].nodeType == 1) {
        elements[node.childNodes[i].getAttribute('id')] = node.childNodes[i];
      }
    }
    return elements
  }
  function checkURL(node) {
    var elements = getElements(node)

    var url = node.querySelector("#URLInput").value;//elements["URLInput"].value //urlDataElement.value
    var title = node.querySelector("#titleInput").value//titleDataElement.value
    var subtitle = node.querySelector("#subtitleInput").value;

    var status = node.querySelector("#status")


    status.innerHTML = "<p>読み込んでいます...</p>";

    Data.checkLoadGroupFromURL(url,
      function success() {
        status.innerHTML = "<p>読み込みに成功しました。</p>"
        Data.loadGroupFromURL(url, {title:title,subtitle:subtitle})
        Data.addURLData(url, { title: title, subtitle: subtitle })
    }, function error() {
      status.innerHTML = "<p>読み込みに失敗しました。</p>"
    })
    Debug.writeln(title)

    Debug.writeln("testes");
  }

  function changeAppTitle(node) {
    var title = node.querySelector("#titleInput").value
    var status = node.querySelector("#status")

    if (title != "") {
      Data.groupsData.title = title;
      document.querySelector("header[role=banner] .pagetitle").textContent = title;
      StorageData.saveURLData();
      status.innerHTML = "<p>アプリタイトルを変更しました。</p>"
    } else {
      status.innerHTML = "<p>文字が入力されていません。</p>"
    }

  }

  //ハッシュ値を生成する
  function createHash(str) {
    var hash = 0, i, char;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
      char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }


})();