(function () {
  "use strict";

  var originalList = new WinJS.Binding.List();

  var list = originalList.createSorted(
    function(first, second) {
      if (first.time == second.time)
      return 0;
      else if (first.time > second.time)
      return 1;
    else
      return -1;
    });

  var groupedItems = list.createGrouped(
      function groupKeySelector(item) { return ((item.group) ? item.group.key : null); },
      function groupDataSelector(item) { return item.group; }
  );

  //ローカルストレージにあるファイルと同期させるデータ
  var groupsData = { groups: [] }

  //色。お遊び
    var color = [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWP4v0z0PwAHHAK6PrQwrwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgcDnzHwADaAIQR5SNSgAAAABJRU5ErkJggg==",
]

  // TODO: データを実際のデータに置き換えます。
  // 非同期ソースのデータは使用可能になるたびに追加できます。
  /*generateSampleData().forEach(function (item) {
    list.push(item);
  });*/

  WinJS.Namespace.define("Data", {
    items: groupedItems,
    groups: groupedItems.groups,
    getItemReference: getItemReference,
    getItemsFromGroup: getItemsFromGroup,
    resolveGroupReference: resolveGroupReference,
    resolveItemReference: resolveItemReference,
    loadGroupFromURL: loadGroupFromURL,
    checkLoadGroupFromURL: checkLoadGroupFromURL,
    setGroupImage: setGroupImage,
    groupsData: groupsData,
    deleteGroup: deleteGroup,
    addURLData: addURLData,
    refreshItem: refreshItem,
  });

  // 項目の参照を取得します。グループ キーと項目のタイトルを
  // 簡単にシリアル化できる、項目への一意の参照として使用します。
  function getItemReference(item) {
    return [item.group.key, item.title];
  }

  // この関数は、指定されたグループに属する項目のみが格納された
  // WinJS.Binding.List を返します。
  function getItemsFromGroup(group) {
    return list.createFiltered(function (item) { return item.group.key === group.key; });
  }

  // 指定されたグループ キーに対応する一意のグループを取得します。
  function resolveGroupReference(key) {
    for (var i = 0; i < groupedItems.groups.length; i++) {
      if (groupedItems.groups.getAt(i).key === key) {
        return groupedItems.groups.getAt(i);
      }
    }
  }

  // 指定された文字列配列から一意の項目を取得します。項目には
  // グループ キーと項目のタイトルが含まれます。
  function resolveItemReference(reference) {
    for (var i = 0; i < groupedItems.length; i++) {
      var item = groupedItems.getAt(i);
      if (item.group.key === reference[0] && item.title === reference[1]) {
        return item;
      }
    }
  }

  //URLからグループをロードする
  function loadGroupFromURL(url,inputData) {
    if (!url || url == "") {
      return  //error
    }
    WinJS.xhr({ url: url }).done(function complete(receivedData) {
      try{
        var jsonData = JSON.parse(receivedData.response);
        var group = {
          key: url,
          title: (inputData.title ? inputData.title : (jsonData.title ? jsonData.title : url)),
          subtitle: (inputData.subtitle?inputData.subtitle:(jsonData.subtitle ? jsonData.subtitle : "")),
          backgroundImage: (jsonData.image ? jsonData.image : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"),
          url: url
        };
       
      
        ((jsonData["event"]) ? jsonData["event"] : jsonData["events"]).forEach(function (eventData) {
          eventData.group=group
          checkData(eventData);
        })
      } catch (error) {
        return;
      }
    },
    function error() {
      var msg = new Windows.UI.Popups.MessageDialog(
    "インターネットに接続していないと、このアプリケーションは使用できません。");

      // Add commands and set their command handlers
      msg.commands.append(
          new Windows.UI.Popups.UICommand("閉じる", function () {window.close()}));


      // Show the message dialog
      msg.showAsync();
      // handle error conditions.
    }
    );

    //受信したデータを正しい形に調整する
    function checkData(data) {
      if (!data.group) {
        return  //error
      }
      if (!data.subtitle) {
        data.subtitle = toStaticHTML((data.address ? data.address + " " : "") + (data.place ? data.place : ""));
      }
      if (!data.description) {
        data.description = (data.event_url ? data.event_url : (data.url ? data.url : ""))
      } else {
        data.description = toStaticHTML(data.description.substring(0, 100));
      }
      if (!data.url) {
        data.url = (data.event_url ? data.event_url : "")
      }
      if (!data.date) {
        data.date = (data.started_at ? data.started_at : (data.ended_at ? data.ended_at : (data.updated_at ? data.updated_at : undefined)))
      }
      if (data.date) {
        if (data.date = new Date(data.date)) {
          data.month = data.date.getMonth() + 1;
          data.day = data.date.getDate();
          data.time = data.date.getTime();
          if (!data.image) {
            data.image =color[data.date.getDay()]
          }
        } else {
          data.month = data.day = "";
        }
      } else {
        data.month = data.day = "";
      }
      if (!data.image) {
        data.image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"
      }

      /* undefinedの場合に空の文字列にする要素を設定 */
      ["title", "content"].forEach(function (element) {
        if (!data[element]) {
          data[element] = "";
        }
        data[element]=toStaticHTML(data[element])
      })

      if ((!data.lat || !data.lon) && data.address) {
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
          function () { return });
      } else {
        setItem(data);
      }

    }

    //住所をもとにジオコーダーから座標を取得する
    function getLatLon(word, onSuccess, onFailed) {
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

    //データをマップおよびリストにセットする
    function setItem(formattedData) {

      var pushpin = null;

      if (formattedData.lat != undefined && formattedData.lon != undefined) {
        pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(formattedData.lat, formattedData.lon), null);
        pushpin.setOptions({
          //icon: 0//iconの画像までのパス いずれはAPIで指定されたURLのアイコンをここに
          //typeName:"micro"
        });
        map.entities.push(pushpin);

        var infobox = new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(formattedData.lat, formattedData.lon), {
          height: 100,
          title: formattedData.title,
          description: formattedData.description,
          titleClickHandler: function () {
            
            window.navigate(formattedData.url);
          },
          pushpin: pushpin
        });
        map.entities.push(infobox);
      }

      Data.items.push({
        group: formattedData.group, title: formattedData.title, subtitle: formattedData.subtitle, description: formattedData.description, content: formattedData.content,
        backgroundImage: formattedData.image, url: formattedData.url,month: formattedData.month,day: formattedData.day,time: formattedData.time, pushpin: pushpin  //pushpin 参照を渡す
      });

      var key = formattedData.group.key
      StorageData.loadImage(Data.resolveGroupReference(key),
        function (image) {
          Data.setGroupImage(Data.resolveGroupReference(key), image);
        }, function () { }
        )
    }
  }

  //URLがきちんとしたJSON形式かチェックする
  function checkLoadGroupFromURL(url, successCallback, errorCallback) {

    WinJS.xhr({ url: url }).done(function complete(receivedData) {
      var jsonData = JSON.parse(receivedData.response);
      if (jsonData["event"]&&jsonData["event"] instanceof Array) {
        successCallback()
      } else if (jsonData["events"] && jsonData["events"] instanceof Array) {
        successCallback()
      } else {
        errorCallback()
      }
      
    },function error(request) {
      errorCallback()
    })
  }

  //グループの画像を設定する
  function setGroupImage(group, image) {
    try {
      //以前使用していたオブジェクトに対するURLを開放する
      URL.revokeObjectURL(group.backgroundImage);
      var imageBlob = URL.createObjectURL(image);
      group.backgroundImage = imageBlob
    } catch (error) {

    }
  }

  //該当するグループに所属するアイテムを削除する
  function deleteGroup(group) {
    //Itemを削除
    getItemsFromGroup(group).splice(0, getItemsFromGroup(group).length)
    StorageData.deleteImage(group)
    for (var i = 0; i < Data.groupsData.groups.length; i++) {
      if (Data.groupsData.groups[i].url === group.key) {
        //グループ自身を削除
        Data.groupsData.groups.splice(i, 1)
        //削除した状態をストレージへ保存
        StorageData.saveURLData();

        
        return
      }
    }
  }

  //URLデータを追加、保存する
  function addURLData(url, inputData) {
    if (!inputData.title) {
      inputData.title = ""
    }
    if (!inputData.subtitle) {
      inputData.subtitle = ""
    }
    Data.groupsData.groups.push({ title: inputData.title,subtitle: inputData.subtitle, url: url })
    StorageData.saveURLData();
  }

  //BindingListをリセットし、Itemを読み直す
  function refreshItem() {
    map.entities.clear();
    list.splice(0, list.length)
    StorageData.loadURLData();
  }

})();
(function () {
  "use strict";

  var applicationData = Windows.Storage.ApplicationData.current;
  var folder = applicationData.localFolder

  WinJS.Namespace.define("StorageData", {
    saveImage: saveImage,
    loadImage: loadImage,
    deleteImage: deleteImage,
    loadURLData: loadURLData,
    saveURLData: saveURLData
  });

  //グループに対応する画像をローカルフォルダへ保存する
  function saveImage(group,image) {
    image.copyAsync(folder, "i" + Utility.createHash(group.key), Windows.Storage.CreationCollisionOption.replaceExisting).done(copySucceeded)
    function copySucceeded(iAsyncAction) {
      Debug.writeln(iAsyncAction.path + "を作成しました。");
      
    }
  }

  //グループに対応する画像をローカルフォルダからロードする
  function loadImage(group,successCallback,errorCallback) {
    folder.getFileAsync("i" + Utility.createHash(group.key))
.done(
//succeeded
function (image) {
  successCallback(image)
},
//not found
function () {
  errorCallback()
});
  }

  //グループに対応する画像を削除する
  function deleteImage(group) {
    folder.getFileAsync("i" + Utility.createHash(group.key))
.done(
function (image) {
  image.deleteAsync(Windows.Storage.StorageDeleteOption.permanentDelete).done(
    function () { }
    , function () { }
    );
},
function () {
});
  }

  //URLデータをローカルフォルダへ保存する
  function saveURLData() {

    folder.createFileAsync("dataFile.json", Windows.Storage.CreationCollisionOption.replaceExisting)
   .then(function (dataFile) {
     
     return Windows.Storage.FileIO.writeTextAsync(dataFile, JSON.stringify(Data.groupsData));
   }).done(function () {
   });
  }

  //URLデータをローカルフォルダからロードし、リストへ追加する
  function loadURLData(/*successCallback,errorCallback*/) {
    folder.getFileAsync("dataFile.json")
   .then(function (file) {
     return Windows.Storage.FileIO.readTextAsync(file);
   }).done(function (groupsData) {
     try{
       Data.groupsData = JSON.parse(groupsData)
       Data.groupsData.groups.forEach(function (group) {
         Data.loadGroupFromURL(group.url, { title: group.title,subtitle:group.subtitle })
       })
       //successCallback(Data.groupsData);
     } catch (error) {
       //errorCallback()
     }
     
   }, function () {
     //errorCallback();
   });
  }



})();