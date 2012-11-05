(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var ui = WinJS.UI;

    ui.Pages.define("/pages/items/items.html", {
        // この関数は、ユーザーがこのページに移動するたびに呼び出されます。
        // ページ要素にアプリケーションのデータを設定します。
        ready: function (element, options) {
            var listView = element.querySelector(".itemslist").winControl;
            listView.itemDataSource = Data.groups.dataSource;
            listView.itemTemplate = itemTemplateFunction//element.querySelector(".itemtemplate");
            listView.oniteminvoked = this._itemInvoked.bind(this);

            this._initializeLayout(listView, Windows.UI.ViewManagement.ApplicationView.value);
            listView.element.focus();

            //リスト用テンプレート関数。リソース解放処理を記述する必要があるため、関数として定義
            function itemTemplateFunction(itemPromise) {

              return itemPromise.then(function (item) {
                var div = document.createElement("div");
                div.className="item"

                var img = document.createElement("img");
                img.className="item-image"
                img.src = item.data.backgroundImage;
                img.alt = item.data.title;
                div.appendChild(img);

                var childDiv = document.createElement("div");
                childDiv.className="item-overlay"

                var title = document.createElement("h4");
                title.className="item-title"
                title.innerText = item.data.title;
                childDiv.appendChild(title);

                var desc = document.createElement("h6");
                desc.className="item-subtitle win-type-ellipsis"
                desc.innerText = item.data.subtitle;
                childDiv.appendChild(desc);

                div.appendChild(childDiv);
                
                //メモリを占有するため、開放するのが望ましいが、item->split->item時にURLが読み込めなくなるために開放できない
                //URL.revokeObjectURL(item.data.backgroundImage);


                return div;
              });
            };

            var appBar = document.getElementById("appbar").winControl;
            appBar.hideCommands(document.getElementById("appbar").querySelectorAll('.singleSelect'));//singleSelectを隠す処理
            listView.addEventListener("selectionchanged", onSelectionChanged, false); //ページを切り替えるごとにリスナーが消えるので、ここにaddEventListenerが必要


            function onSelectionChanged(event) {
               
              var listView = event.currentTarget.winControl;

              var appBar = document.getElementById("appbar").winControl;
              if (listView.selection.count() == 1) {
                
                appBar.showCommands(document.getElementById("appbar").querySelectorAll('.singleSelect'));

                var items = listView.selection.getItems()
                Debug.writeln(items._value[0].key)

                // ここでAppBarが表示される。
                appBar.show();

              } else {
                appBar.hide();
                appBar.hideCommands(document.getElementById("appbar").querySelectorAll('.singleSelect'));
              }
              }

        },

        // この関数は、viewState の変更に応じてページ レイアウトを更新します。
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = element.querySelector(".itemslist").winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    }
                    listView.addEventListener("contentanimating", handler, false);
                    var firstVisible = listView.indexOfFirstVisible;
                    this._initializeLayout(listView, viewState);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                }
            }
        },

        // この関数は、新しいレイアウトで ListView を更新します
        _initializeLayout: function (listView, viewState) {
            /// <param name="listView" value="WinJS.UI.ListView.prototype" />

            if (viewState === appViewState.snapped) {
                listView.layout = new ui.ListLayout();
            } else {
                listView.layout = new ui.GridLayout();
            }
        },

        _itemInvoked: function (args) {
          var groupKey = Data.groups.getAt(args.detail.itemIndex).key;
          WinJS.Navigation.navigate("/pages/split/split.html", { groupKey: groupKey });

          /* アイテムがクリックされるとpinを更新させる。 */

          Data.items.forEach(function (item) {
            if (item.pushpin) {
              item.pushpin[map.entities.bingEventID].iconData.iconStyle = 0
              Microsoft.Maps.Events.invoke(item.pushpin, 'entitychanged', { entity: item.pushpin });
            }
          })
          Data.getItemsFromGroup({key:groupKey}).forEach(function (item) {
            if (item.pushpin) {
              item.pushpin[map.entities.bingEventID].iconData.iconStyle = 55
              Microsoft.Maps.Events.invoke(item.pushpin, 'entitychanged', { entity: item.pushpin });
            }
          })

        }
    });
})();
