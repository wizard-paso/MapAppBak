(function () {
  "use strict";

  var list = new WinJS.Binding.List();
  var groupedItems = list.createGrouped(
      function groupKeySelector(item) { return ((item.group) ? item.group.key : null); },
      function groupDataSelector(item) { return item.group; }
  );

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
    checkLoadGroupFromURL:checkLoadGroupFromURL
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

  function loadGroupFromURL(url,title) {
    if (!url || url == "") {
      return  //error
    }
    /*if(typeof json!=object){
      json=JSON.parse(json)
    }*/
    WinJS.xhr({ url: url }).done(function complete(receivedData) {
      var jsonData = JSON.parse(receivedData.response);
      var group = {
        key: url,
        title: (title?title:(jsonData.title ? jsonData.title : jsonData.url)),
        subtitle: (jsonData.subtitle ? jsonData.subtitle : ""),
        backgroundImage: (jsonData.image ? jsonData.image : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"),
        url: url
      };
       
      
      ((jsonData["event"]) ? jsonData["event"] : jsonData["events"]).forEach(function (eventData) {
        eventData.group=group
        checkData(eventData);
      })
    });

    function checkData(data) {
      if (!data.group) {
        return  //error
      }
      if (!data.subtitle) {
        data.subtitle = toStaticHTML((data.address ? data.address + " " : "") + (data.place ? data.place : ""));
      }
      if (!data.description) {
        data.description = (data.event_url ? data.event_url : "")
      } else {
        data.description = toStaticHTML(data.description.substring(0, 100));
      }
      if (!data.image) {
        data.image= "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC"
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
    // geocode api request
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

          },
          pushpin: pushpin
        });
        map.entities.push(infobox);
      }

      Data.items.push({
        group: formattedData.group, title: formattedData.title, subtitle: formattedData.subtitle, description: formattedData.description, content: formattedData.content,
        backgroundImage: formattedData.image, pushpin: pushpin  //pushpin 参照を渡す
      });

    }

  }
  function checkLoadGroupFromURL(url,callback) {

    WinJS.xhr({ url: url }).done(function complete(receivedData) {
      var jsonData = JSON.parse(receivedData.response);
      if (jsonData["event"]&&jsonData["event"] instanceof Array) {
        callback(true)
      } else if (jsonData["events"] && jsonData["events"] instanceof Array) {
        callback(true)
      } else {
        callback(false)
      }
      
    },function error(request) {
      callback(false)
    })
  }


  // アプリケーションのデータ リストに追加できるサンプル データの配列を
  // 返します。 
  function generateSampleData() {
    var itemContent = "<p>Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat</p><p>Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat</p><p>Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat</p><p>Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat</p><p>Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat</p><p>Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat</p><p>Curabitur class aliquam vestibulum nam curae maecenas sed integer cras phasellus suspendisse quisque donec dis praesent accumsan bibendum pellentesque condimentum adipiscing etiam consequat vivamus dictumst aliquam duis convallis scelerisque est parturient ullamcorper aliquet fusce suspendisse nunc hac eleifend amet blandit facilisi condimentum commodo scelerisque faucibus aenean ullamcorper ante mauris dignissim consectetuer nullam lorem vestibulum habitant conubia elementum pellentesque morbi facilisis arcu sollicitudin diam cubilia aptent vestibulum auctor eget dapibus pellentesque inceptos leo egestas interdum nulla consectetuer suspendisse adipiscing pellentesque proin lobortis sollicitudin augue elit mus congue fermentum parturient fringilla euismod feugiat";
    var itemDescription = "Item Description: Pellentesque porta mauris quis interdum vehicula urna sapien ultrices velit nec venenatis dui odio in augue cras posuere enim a cursus convallis neque turpis malesuada erat ut adipiscing neque tortor ac erat";
    var groupDescription = "Group Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tempor scelerisque lorem in vehicula. Aliquam tincidunt, lacus ut sagittis tristique, turpis massa volutpat augue, eu rutrum ligula ante a ante";

    // これらの 3 つの文字列は、プレースホルダー イメージをエンコードします。
    // 実際のデータで backgroundImage プロパティをイメージの URL に設定できます。
    var darkGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC";
    var lightGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY7h4+cp/AAhpA3h+ANDKAAAAAElFTkSuQmCC";
    var mediumGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY5g8dcZ/AAY/AsAlWFQ+AAAAAElFTkSuQmCC";

    // これらの各サンプル グループには、個別に表示する一意のキーが
    // 必要です。
    var sampleGroups = [
        //{ key: "Atnd", title: "Atnd", subtitle: "Group Subtitle: 1", backgroundImage: darkGray, description: groupDescription, url: "http://api.atnd.org/events/?keyword_or=google,cloud&format=json&count=100", func: funcAtnd },
        { key: "kokucheese1", title: "こくちーず", subtitle: "Group Subtitle: 2", backgroundImage: lightGray, description: groupDescription, url: "http://azusaar.appspot.com/api/kokucheese?count=100", func: funcAtnd },
        { key: "partake1", title: "partake", subtitle: "Group Subtitle: 3", backgroundImage: mediumGray, description: groupDescription, url: "http://azusaar.appspot.com/api/partake?count=100", func: funcAtnd },
        { key: "zusaar1", title: "zusaar", subtitle: "Group Subtitle: 4", backgroundImage: lightGray, description: groupDescription, url: "http://azusaar.appspot.com/api/zusaar?count=100", func: funcAtnd }
    ];

    function funcAtnd(obj) {
      return {
        title: obj.title,
        subtitle: "subtitle",
        description: obj.event_url,
        content: "",
        lat: obj.lat,
        lon: obj.lon
        /* title:obj.title,
         event_url:obj.event_url,
         started_at:obj.started_at,
         address:obj.address,
         place:obj.place,
         lat:obj.place,
         lon:obj.lon */
      }
    }

    // これらの各サンプル項目には、特定のグループへの参照が
    // 必要です。
    var sampleItems = [
        { group: sampleGroups[0], title: "Item Title: 1", subtitle: "Item Subtitle: 1", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[0], title: "Item Title: 2", subtitle: "Item Subtitle: 2", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[0], title: "Item Title: 3", subtitle: "Item Subtitle: 3", description: itemDescription, content: itemContent, backgroundImage: mediumGray },
        { group: sampleGroups[0], title: "Item Title: 4", subtitle: "Item Subtitle: 4", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[0], title: "Item Title: 5", subtitle: "Item Subtitle: 5", description: itemDescription, content: itemContent, backgroundImage: mediumGray },

        { group: sampleGroups[1], title: "Item Title: 1", subtitle: "Item Subtitle: 1", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[1], title: "Item Title: 2", subtitle: "Item Subtitle: 2", description: itemDescription, content: itemContent, backgroundImage: mediumGray },
        { group: sampleGroups[1], title: "Item Title: 3", subtitle: "Item Subtitle: 3", description: itemDescription, content: itemContent, backgroundImage: lightGray },

        { group: sampleGroups[2], title: "Item Title: 1", subtitle: "Item Subtitle: 1", description: itemDescription, content: itemContent, backgroundImage: mediumGray },
        { group: sampleGroups[2], title: "Item Title: 2", subtitle: "Item Subtitle: 2", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[2], title: "Item Title: 3", subtitle: "Item Subtitle: 3", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[2], title: "Item Title: 4", subtitle: "Item Subtitle: 4", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[2], title: "Item Title: 5", subtitle: "Item Subtitle: 5", description: itemDescription, content: itemContent, backgroundImage: mediumGray },
        { group: sampleGroups[2], title: "Item Title: 6", subtitle: "Item Subtitle: 6", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[2], title: "Item Title: 7", subtitle: "Item Subtitle: 7", description: itemDescription, content: itemContent, backgroundImage: mediumGray },

        { group: sampleGroups[3], title: "Item Title: 1", subtitle: "Item Subtitle: 1", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[3], title: "Item Title: 2", subtitle: "Item Subtitle: 2", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[3], title: "Item Title: 3", subtitle: "Item Subtitle: 3", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[3], title: "Item Title: 4", subtitle: "Item Subtitle: 4", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[3], title: "Item Title: 5", subtitle: "Item Subtitle: 5", description: itemDescription, content: itemContent, backgroundImage: mediumGray },
        { group: sampleGroups[3], title: "Item Title: 6", subtitle: "Item Subtitle: 6", description: itemDescription, content: itemContent, backgroundImage: lightGray },

        { group: sampleGroups[4], title: "Item Title: 1", subtitle: "Item Subtitle: 1", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[4], title: "Item Title: 2", subtitle: "Item Subtitle: 2", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[4], title: "Item Title: 3", subtitle: "Item Subtitle: 3", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[4], title: "Item Title: 4", subtitle: "Item Subtitle: 4", description: itemDescription, content: itemContent, backgroundImage: mediumGray },

        { group: sampleGroups[5], title: "Item Title: 1", subtitle: "Item Subtitle: 1", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[5], title: "Item Title: 2", subtitle: "Item Subtitle: 2", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[5], title: "Item Title: 3", subtitle: "Item Subtitle: 3", description: itemDescription, content: itemContent, backgroundImage: mediumGray },
        { group: sampleGroups[5], title: "Item Title: 4", subtitle: "Item Subtitle: 4", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[5], title: "Item Title: 5", subtitle: "Item Subtitle: 5", description: itemDescription, content: itemContent, backgroundImage: lightGray },
        { group: sampleGroups[5], title: "Item Title: 6", subtitle: "Item Subtitle: 6", description: itemDescription, content: itemContent, backgroundImage: mediumGray },
        { group: sampleGroups[5], title: "Item Title: 7", subtitle: "Item Subtitle: 7", description: itemDescription, content: itemContent, backgroundImage: darkGray },
        { group: sampleGroups[5], title: "Item Title: 8", subtitle: "Item Subtitle: 8", description: itemDescription, content: itemContent, backgroundImage: lightGray }
    ];



    return sampleItems;
  }
})();
