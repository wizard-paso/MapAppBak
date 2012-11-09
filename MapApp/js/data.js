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

  //曜日ごとの色0-6、日ｰ土の7種
    var color = [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWP4v0z0PwAHHAK6PrQwrwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgcDnzHwADaAIQR5SNSgAAAABJRU5ErkJggg==",
    ]

    var dataDefinition = {
      event: { instanceOf: Array, data: [["events"], ["items"], ["Items"], ["data", "items"], [],["results"],["value","items"]] },
      groupTitle: { typeOf: "string", data: [["Title"]] },
      groupSubitle: { typeOf: "string", data: [["subtitle"]] },
      groupImage: { typeOf: "string", data: [["image"]] },
      title: { typeOf: "string", data: [["Title"], ["user", "name"], ["from_user"]] },
      subtitle: { typeOf: "string", data: [["subtitle"], ["user", "screen_name"], ["from_user_name"]] },
      lat: { typeOf: "string", data: [["Location", "Lat"], ["place", "bounding_box", "coodinates", 0, 0]] },
      lon: { typeOf: "string", data: [["Location", "Lng"], ["place", "bounding_box", "coodinates", 0, 1]] },
      address: { typeOf: "string", data: [["location"], ["Location", "Address"], ["place", "name"]] },
      url: { typeOf: "string", data: [["event_url"], ["alternateLink"], ["Url"], ["Link"]] },
      description: { typeOf: "string", data: [["details"], ["event_url"], ["url"], ["text"]] },
      date: { typeOf: "string", data: [["started_at"], ["StartDate"], ["when", 0, "start"], ["updated_at"], ["updated"], ["created_at"]] }
    }
  /*if (!data.title) {
  data.title = (data.Title ? data.Title : undefined)
}
if (!data.address) {
  data.address = (data.location ? data.location : (data.Location && data.Location.Address ? data.Location.Address : undefined))
}
if (!data.lat || !data.lon) {
  data.lat = (data.Location && data.Location.Lat) ? data.Location.Lat : undefined
  data.lon = (data.Location && data.Location.Lng) ? data.Location.Lng : undefined
}
if (!data.subtitle) {
  data.subtitle = toStaticHTML((data.address ? data.address + " " : "") + (data.place ? data.place : ""));
}
if (!data.url) {
  data.url = (data.event_url ? data.event_url : (data.alternateLink ? data.alternateLink : (data.Url ? data.Url : (data.Link ? data.Link : ""))))
}
if (!data.description) {
  data.description = (data.details ? data.details.substring(0, 100) : (data.event_url ? data.event_url : (data.url ? data.url : "")))
} else {
  data.description = toStaticHTML(data.description.substring(0, 100));
}
if (!data.date) {
  data.date = (data.started_at ?
    data.started_at : (data.StartDate ?
      data.StartDate : (data.when[0].start ?
        data.when[0].start : (data.updated_at ?
        data.updated_at : (data.updated ?
        data.updated : undefined)))))
}*/

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
    findData: findData
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
          title: (inputData.title ? inputData.title : (findData(jsonData,"groupTitle")?findData(jsonData,"groupTitle"):url)),
          subtitle: (inputData.subtitle ? inputData.subtitle : (findData(jsonData, "groupSubtitle")?findData(jsonData, "groupSubtitle"):"")),
          backgroundImage: (findData(jsonData, "groupImage") ? findData(jsonData, "groupImage") : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMwNjb+DwACzwGZM+tEvwAAAABJRU5ErkJggg=="/*"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"*/),
          url: url,
          API: url.split("/")[2]
        };

        var array = findData(jsonData, "event");

        /*if (jsonData.event&&jsonData.event instanceof Array) {
          //Array要素がeventの場合。azusaarなど
          array = jsonData.event
        } else if (jsonData.events&&jsonData.events instanceof Array) {
          //Array要素がeventsの場合。atndなど
          array = jsonData.events
        } else if (jsonData.items&&jsonData.items instanceof Array) {

          array = jsonData.items
        } else if (jsonData.Items && jsonData.Items instanceof Array) {
          //eventcastなど
          array = jsonData.Items
        } else if (jsonData.data&&(jsonData.data.items && jsonData.data.items instanceof Array)) {
          //Array要素がdata.itemsの場合。Googleカレンダーなど
          array = jsonData.data.items
        }*/

        if (array) {
          array.forEach(function (eventData) {
            eventData.group = group
            checkData(eventData);
          })
        }
      
        
      } catch (error) {
        return;
      }
    },
    function error(result) {
      var msg;

      switch (result.status) {
        case 0:
          msg = new Windows.UI.Popups.MessageDialog(
        "インターネットに接続していないと、このアプリケーションは使用できません。");

          msg.commands.append(
              new Windows.UI.Popups.UICommand("閉じる", function () { window.close() }));

          msg.showAsync();
          break;
        case 404:
          msg = new Windows.UI.Popups.MessageDialog(
        "サイトに接続できません。 ["+result.status+"] URL: "+url);

          msg.commands.append(
              new Windows.UI.Popups.UICommand("閉じる", function () {}));

          msg.showAsync();
          break;
        default:
          msg = new Windows.UI.Popups.MessageDialog(
"サイト接続エラー [" + result.status + "] URL: " + url);

          msg.commands.append(
              new Windows.UI.Popups.UICommand("閉じる", function () { }));

          msg.showAsync();
          break;
      }

    }
    );

    //受信したデータを正しい形に調整する
    function checkData(data) {
      if (!data.group) {
        return  //error
      }
      ["title", "subtitle", "address", "lat", "lon", "url", "description", "date"].forEach(function (item) {
        if(!data[item])
        data[item]=findData(data,item)
      })
      /*if (!data.title) {
        data.title = (data.Title ? data.Title : undefined)
      }
      if (!data.address) {
        data.address = (data.location ? data.location : (data.Location && data.Location.Address ? data.Location.Address : undefined))
      }
      if (!data.lat || !data.lon) {
        data.lat = (data.Location && data.Location.Lat) ? data.Location.Lat : undefined
        data.lon = (data.Location && data.Location.Lng) ? data.Location.Lng : undefined
      }
      if (!data.subtitle) {
        data.subtitle = toStaticHTML((data.address ? data.address + " " : "") + (data.place ? data.place : ""));
      }
      if (!data.url) {
        data.url = (data.event_url ? data.event_url : (data.alternateLink ? data.alternateLink : (data.Url ? data.Url : (data.Link ? data.Link : ""))))
      }
      if (!data.description) {
        data.description = (data.details ? data.details.substring(0, 100) : (data.event_url ? data.event_url : (data.url ? data.url : "")))
      } else {
        data.description = toStaticHTML(data.description.substring(0, 100));
      }
      if (!data.date) {
        data.date = (data.started_at ?
          data.started_at : (data.StartDate ?
            data.StartDate : (data.when[0].start ?
              data.when[0].start : (data.updated_at ?
              data.updated_at : (data.updated ?
              data.updated : undefined)))))
      }*/

      /* 日時をDate型へ変換 */
      if (data.date) {
        Debug.writeln(data.date, new Date(data.date))
        /* Date型に変換できたら */
        if (!isNaN(new Date(data.date))) {
          data.date = new Date(data.date)
          data.month = data.date.getMonth() + 1;
          data.day = data.date.getDate();
          data.time = data.date.getTime();
          if (!data.image) {  /* 画像がない場合は曜日の色へ */
            data.image =color[data.date.getDay()]
          }
          /* 変換できなかったら */
        } else{
          /* IE対策日時フォーマット http://l-w-i.net/m/20081202_01.txt */
          try{
            var created_at = data.date.split(" ");
            var post_date = created_at[1] + " "
                 + created_at[2] + ", "
                 + created_at[5] + " "
                 + created_at[3];
            /* IE用の処置がうまくいけば */
            if (!isNaN(new Date(post_date))) {
              data.date = new Date(post_date)
              data.month = data.date.getMonth() + 1;
              data.day = data.date.getDate();
              data.time = data.date.getTime();
              if (!data.image) {  /* 画像がない場合は曜日の色へ */
                data.image = color[data.date.getDay()]
              }
              /* 対策も無理だったら */
            } else {
              data.month = data.day = "";
            }
          }catch(error){
            data.month = data.day = "";
          }
        }
        /* data.dateが存在しなければ */
      } else {
        data.month = data.day = "";
      }

      /* 存在しない場合に空にする要素 */
      ["title", "content","description"].forEach(function (element) {
        if (!data[element]) {
          data[element] = "";
        }
      })

      /* その他、調整すべきもの 画像なしの場合など */
      /* 画像がない場合は灰色を使う */
      if (!data.image) {
        data.image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"
      }
      /* subtitleが存在しなければ、あれば住所+場所を使う */
      if (!data.subtitle) {
        data.subtitle=(data.address ? data.address + " " : "") + (data.place ? data.place : "")
      }
      /* descriptionがあれば、150文字に制限する */
      if (data.description) {
        data.description = data.description.substring(0, 150);
      }

      /* ついったーの場合はAPIでアドレスを返さないので、ここで生成する */
      if (data.API == "api.twitter.com") {
        data.url = "http://twitter.com/" + data.user.screen_name + "/status/" + data.id_str
      } else if (data.API == "search.twitter.com") {
          url: "http://twitter.com/" + data.from_user + "/status/" + data.id_str
      }

      /* 制約にひっかかりそうなものを静的HTML化する */
      ["title", "subtitle","content","description","address"].forEach(function (element) {
        data[element] = toStaticHTML(data[element])
      })

      /* 座標がない場合はジオコーダーを使って取得する */
      if ((!data.lat || !data.lon) && (data.address&&data.address!="")) {
        var tmpData = data;
        getLatLon(tmpData.address,
          function (result) {
            if (result.results&&result.results[0]) {
              tmpData.lat = result.results[0].location.latitude;
              tmpData.lon = result.results[0].location.longitude;
              setItem(tmpData);
            } /*else if (result.parseResults&&result.parseResults[0]) {//searchManager.searchを利用した場合の結果
              tmpData.lat = result.parseResults[0].location.location.latitude
              tmpData.lon = result.parseResults[0].location.location.longitude
            }*/else {
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
          text: '1'
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

      try{//画像がない場合は以下でエラーが発生する。仕様
        var key = formattedData.group.key
        StorageData.loadImage(Data.resolveGroupReference(key),
          function (image) {
            Data.setGroupImage(Data.resolveGroupReference(key), image);
          }, function () { }
          )
      } catch (error) {

      }
    }
  }

  //URLがきちんとしたJSON形式かチェックする
  function checkLoadGroupFromURL(url, successCallback, errorCallback) {

    WinJS.xhr({ url: url }).done(function complete(receivedData) {
      try{
        var jsonData = JSON.parse(receivedData.response);
        if (findData(jsonData, "event")) {
          successCallback()
        } else {
          errorCallback()
        }
        /*if (jsonData.event&&jsonData.event instanceof Array) {
          successCallback()
        } else if (jsonData.events && jsonData.events instanceof Array) {
          successCallback()
        } else if (jsonData.items && jsonData.items instanceof Array) {
          successCallback()
        } else if (jsonData.Items && jsonData.Items instanceof Array) {
          successCallback()
        } else if (jsonData.data && (jsonData.data.items && jsonData.data.items instanceof Array)) {
          successCallback()
        } else {
          errorCallback()
        }*/
      } catch (error) {
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

  //BindingListをリセットし、Itemを読み直す //現在は全体更新のみ
  function refreshItem(group) {
    try{
     /* if (group) {
        getItemsFromGroup(group).forEach(function (item) {
          if (item.pushpin) {
            var index = map.entities.indexOf(item.pushpin)
            if (index > -1) {
              map.entities.removeAt(index)
            }
          }
        })
        getItemsFromGroup(group).splice(0, getItemsFromGroup(group).length)
        loadGroupFromURL(group.url, { title: group.title, subtitle: group.subtitle })
      } else {*/
        map.entities.clear();
        list.splice(0, list.length)
        StorageData.loadURLData();
      //}
    } catch (error) { }
  }

  //あらかじめ定義したデータ構造に基づいて、該当するデータを探す
  function findData(data, property) {
    try{
      var definition = dataDefinition[property]
      if (!definition) { return undefined }
      var array = definition.data
      var typeOf = definition.typeOf
      var instanceOf = definition.instanceOf

      for (var value in array) {
        var obj = data
        for (var objName in array[value]) {
          if (!(obj = obj[array[value][objName]])) {
            break
          }
        }
        if (typeOf&&typeof obj == typeOf) {
          return obj;
      }else if(instanceOf&&obj instanceof instanceOf){
        return obj;
        }

      }
    } catch (error) {
    }
    return undefined;
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
       if (!Data.groupsData.title) {
         Data.groupsData.title = "Hakutiz";
       }
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