//
// This is the original source I found on the website, for reference
//
(function() {
  // keep things in cache for sevaral hours

  const d = new Date();
  let cacheStr = "";
  cacheStr += `${d.getMonth()}${Math.round(
    (d.getDate() * 24 + d.getHours()) / 6
  )}`;

  // Constants and stuff

  const PHONES_URL = `http://www.gsmarena.com/quicksearch-${cacheStr}.jpg`;
  const THUMB_URL = "http://cdn2.gsmarena.com/vv/bigpic/";
  const BIGPIC_URL = THUMB_URL;
  const MAX_LINES = 5;
  const DELAY_BEFORE_AUTOCLICK = 2000;
  const ANIMATION_DELAY = 250;

  // Keyboard keycodes

  const KEY_LEFT_ARROW = 37;
  const KEY_RIGHT_ARROW = 39;
  const KEY_UP_ARROW = 38;
  const KEY_DOWN_ARROW = 40;
  const KEY_BACKSPACE = 8;
  const KEY_ESCAPE = 27;
  const KEY_ENTER = 13;

  // Ugly hack to get IE8 to work

  function getElementsByClassName(class_, elem) {
    if (document.getElementsByClassName) {
      if (elem) return elem.getElementsByClassName(class_);
      return document.getElementsByClassName(class_);
    }
    const result = [];

    const all = elem
      ? elem.getElementsByTagName("*")
      : document.getElementsByTagName("*");
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (new RegExp(`(^|\\s)${class_}(\\s|$)`).test(el.className)) {
        result.push(el);
      }
    }

    return result;
  }

  // XMLHttpRequest helper

  function XHR() {
    let xhr;

    if (window.XDomainRequest) {
      xhr = new XDomainRequest();
    } else if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      try {
        xhr = new ActiveXObject("Msxml2.XMLHTTP");
      } catch (x) {
        try {
          xhr = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (x) {
          xhr = null;
        }
      }
    }

    return xhr;
  }

  // Fetch phones list from gsmarena

  let loading = 0;

  function loadList(callback) {
    if (loading > 0) return; // list already loaded or loading, do nothing

    loading = 1; // trying to load list, flag it with false so it doesn't send extra requests

    const xhr = XHR();

    if (xhr === null) {
      loading = 0;
      return;
    }

    xhr.open("GET", PHONES_URL, true);

    function parseJSON(rt) {
      let data;

      if (window.JSON) {
        // try to parse JSON natively

        data = JSON.parse(rt);
      } else {
        // use eval() otherwise

        data = eval(`(${rt})`);
      }

      return data;
    }

    /* xhr.onreadystatechange = function(e) {
          if (xhr.readyState == 4)
            if (xhr.status == 200) {
            loading = 2;
              var data = parseJSON(xhr.responseText);
              callback(data[0], data[1]);
            } else {
              loading = 0;
              //alert("Error loading list of phones");
            }
        } */

    xhr.onload = function(e) {
      loading = 2;
      const data = parseJSON(xhr.responseText);
      callback(data[0], data[1]);
    };

    xhr.onerror = function(e) {
      loading = 0;
    };

    xhr.send(null);
  }

  // Event helpers

  function addEventListener(elem, evt, listener) {
    if (!elem) return;

    if (document.addEventListener) {
      elem.addEventListener(evt, listener, false);
    } else if (document.attachEvent) {
      elem.attachEvent(`on${evt}`, listener);
    }
  }

  function triggerEvent(evt, el) {
    if (!el) return;

    let event;
    if (document.createEvent) {
      event = document.createEvent("HTMLEvents");
      event.initEvent(evt, true, true);
    } else {
      event = document.createEventObject();
      event.eventType = `on${evt}`;
    }

    event.eventName = evt;
    event.memo = {};

    if (document.createEvent) {
      el.dispatchEvent(event);
    } else {
      el.fireEvent(event.eventType, event);
    }
  }

  // load widget CSS

  /* function loadCSS(url) {
      var style = document.createElement("link");
      style.rel = "stylesheet";
      style.type = "text/css";
      style.href = url; 

      document.getElementsByTagName("head")[0].appendChild(style);
    } */

  const widgetHTML =
    "" +
    '<div id="gsma_search">' +
    ' <form id="gsma_search_form">' +
    '   <div id="gsma_form_holder">' +
    "     <table>" +
    "       <tr>" +
    '         <td class="searchInput">' +
    '           <img src="http://st.gsmarena.com/vv/webmasters/search-widget/search-icon.gif" class="gsma_search_icon" alt="" />' +
    '           <input type="hidden" value="yes" name="gsma_sQuickSearch" id="gsma_sQuickSearch" />' +
    '           <input type="search" name="gsma_sSearch" placeholder="Phone search" results="5" id="gsma_searchfield" class="boxsizingBorder" autocomplete="off" />' +
    "         </td>" +
    "       </tr>" +
    "     </table>" +
    "   </div>" +
    '   <div id="gsma_search_results" class="boxsizingBorder" style="visibility: hidden;">' +
    '     <div class="gsma_autocomplete gsma_autocomplete-search" id="gsma_autocomplete1">' +
    "       <ul>" +
    "       </ul>" +
    "     </div>" +
    '     <div id="gsma_phone_detail">' +
    '       <div id="animate" class="animated">' +
    '         <a href="" target="_blank" id="gsma_phone_pic"> ' +
    '           <img src="" alt="" />' +
    "         </a>" +
    '         <div id="gsma_table">' +
    "         </div>" +
    '         <a class="gsma_full_specs_link" target="_blank" href="http://www.gsmarena.com">Go to GSMArena.com &raquo;' +
    "         </a>" +
    "       </div>" +
    "     </div>" +
    "   </div> " +
    " </form>" +
    "</div>";

  document.write(widgetHTML);

  if (document.getElementById("gsma_search").parentNode.offsetWidth >= 400)
    document.write(
      "<link rel='stylesheet' type='text/css' href='http://st.gsmarena.com/vv/webmasters/search-widget/style.css' />"
    );
  else
    document.write(
      "<link rel='stylesheet' type='text/css' href='http://st.gsmarena.com/vv/webmasters/search-widget/style-narrow.css' />"
    );
  // document.write("<link rel='stylesheet' type='text/css' href='http://st.gsmarena.com/vv/webmasters/search-widget/animate.css' />");
  document.write(
    "<!--[if lt IE 8]><link rel='stylesheet' type='text/css' href='http://st.gsmarena.com/vv/webmasters/search-widget/style-lte-ie8.css' /><![endif]-->"
  );

  const field = document.getElementById("gsma_searchfield");
  const results = document.getElementById("gsma_search_results");
  const detail = document.getElementById("gsma_phone_detail");
  const table = document.getElementById("gsma_table");
  const phoneBigPicLink = document.getElementById("gsma_phone_pic");
  const phoneBigPic = phoneBigPicLink.getElementsByTagName("img")[0];
  const phoneLinkToGSMA = getElementsByClassName("gsma_full_specs_link")[0];

  const resultsList = results.getElementsByTagName("ul")[0];

  let phones;
  let makers;

  addEventListener(field, "click", function() {
    loadList(function(_makers, _phones) {
      makers = _makers;
      phones = _phones;

      // display results if the user typed in a query before the phones list was loaded
      triggerEvent("keyup", field);
    });
  });

  const MAKERID = 0;
  const PHONEID = 1;
  const NAME = 2;
  const SEARCH_STR = 3;
  const THUMB = 4;

  function filterPhones(filter) {
    function trim(s) {
      if (!s) return;
      return s.replace(/^\s+|\s+$/g, "");
    }

    function doMatch(s1, s2) {
      if (s1 == "") return false;

      const l = s1.split(/\s+/g);

      for (let i = 0; i < l.length; i++) {
        const t = l[i];

        if (t.match(/^[^0-9]/)) {
          if (s2.indexOf(t) != 0 && s2.indexOf(` ${t}`) == -1) return false;
        } else if (s2.indexOf(t) == -1) return false;
      }

      return true;
    }

    if (!filter) return;

    // trim leading and trailing whitespace

    filter = trim(filter).toLowerCase();

    // do nothing for empty string or just whitespace OR when phones data failed to load

    if (filter === "" || !phones) return;

    // check if maker is included

    let makerID = false;
    for (maker in makers) {
      const m = makers[maker].toLowerCase();
      const t = filter.substring(0, m.length).toLowerCase();
      if (m == t) {
        if (makerID && makers[`${makerID}`].length > m.length)
          // prefer "sony ericsson" over "sony" for s == "sony er..."
          continue;

        makerID = parseInt(maker, 10);
      }
    }

    // remove maker name (if found) from search string

    if (makerID)
      filter = trim(filter.replace(makers[`${makerID}`].toLowerCase(), ""));

    // search list

    const res = [];
    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];

      // phone from different maker
      if (makerID && phone[MAKERID] != makerID) continue;

      const name = phone[NAME].toLowerCase();
      const searchStr = phone[SEARCH_STR].toLowerCase();

      if (filter === "" || doMatch(filter, name) || doMatch(filter, searchStr))
        res.push(phone);

      if (res.length == MAX_LINES) break;
    }

    return res;
  }

  // Show/hide results

  function showResults() {
    results.style.visibility = "visible";
  }

  function hideResults() {
    results.style.visibility = "hidden";
  }

  function resultsAreHidden() {
    return results.style.visibility == "hidden";
  }

  // Update list of phones and phone info

  let lastClickedId;
  const bigPic = new Image();

  function setResultsList(_list) {
    const list = _list;

    if (list && list.length !== 0) showResults();
    else {
      hideResults();
      return;
    }

    resultsList.innerHTML = "";

    for (let i = 0; i < list.length; i++) {
      const img = document.createElement("img");
      img.src = THUMB_URL + list[i][THUMB];

      const span = document.createElement("span");
      span.innerHTML = `${makers[list[i][MAKERID]]} ${list[i][NAME]}`;

      const a = document.createElement("a");
      a.href = "javascript: return false;";

      a.appendChild(img);
      a.appendChild(span);

      function makeOnClickHandler(anchor, phone) {
        function addClass(el, cl) {
          if (el.className.indexOf(cl) == -1) el.className += ` ${cl}`;
        }

        function removeClass(el, cl) {
          el.className = el.className.replace(cl, "");
        }

        function cleanURL(s) {
          return s.toLowerCase().replace(/\s+|-|\/|\./g, "_"); // .replace(/[^a-z0-9_]+/gi, "");
        }

        function makeURL(p) {
          let s = cleanURL(makers[`${p[MAKERID]}`]);
          s += `_${cleanURL(p[NAME])}`;
          s += `-${p[PHONEID]}.php`;
          return s;
        }

        return function() {
          // keep focus on the text field so that the widget doesn't hide

          field.focus();

          // make sure we don't animate if the user already clicked on something

          clearTimeout(autoclickTimeout);

          // and that we don't animate the same thing again

          if (lastClickedId == phone[PHONEID]) return false;

          lastClickedId = phone[PHONEID];

          const link = `http://www.gsmarena.com/${makeURL(phone)}`;
          phoneBigPicLink.href = link;
          bigPic.src = BIGPIC_URL + phone[THUMB]; // start loading the big pic right away

          setTimeout(function() {
            // but only change it after the animation has taken the old one out of sight
            phoneBigPic.src = bigPic.src;
          }, ANIMATION_DELAY);

          phoneLinkToGSMA.href = link;
          phoneLinkToGSMA.innerHTML = `${makers[phone[MAKERID]]} ${
            phone[NAME]
          } full specifications &raquo;`;

          loadDetails(phone[PHONEID]);

          const as = resultsList.getElementsByTagName("a");
          for (let i = 0; i < as.length; i++)
            removeClass(as[i], "gsma_current");

          addClass(anchor, "gsma_current");

          return false;
        };
      }

      addEventListener(a, "click", makeOnClickHandler(a, list[i]));

      const li = document.createElement("li");
      li.value = i;
      li.appendChild(a);

      resultsList.appendChild(li);
    }
  }

  function loadDetails(phoneId) {
    const animationIn = "bounceInLeft";
    const animationOut = "bounceOutRight"; // animationIn.replace("In", "Out");

    const animated = document.getElementById("animate");

    const xhr = XHR();

    xhr.open(
      "GET",
      `http://www.gsmarena.com/phone-widget.php3?idPhone=${phoneId}`,
      true
    );

    xhr.onload = function(e) {
      table.innerHTML = `<table cellspacing="0">${xhr.responseText}</table>`;
    };

    xhr.onerror = function(e) {
      table.innerHTML = "Error occured while loading phone info";
    };

    xhr.ontimeout = function(e) {
      table.innerHTML =
        "Error occured while loading phone info (request timed out)";
    };

    xhr.send(null);

    if (animated.className.indexOf(animationIn) == -1)
      animated.className += ` ${animationIn}`;
    else {
      animated.className = animated.className.replace(
        animationIn,
        animationOut
      );
      setTimeout(function() {
        animated.className = animated.className.replace(
          animationOut,
          animationIn
        );
      }, ANIMATION_DELAY);
    }
  }

  // Handle keyboard input

  let filteredList = [];
  let autoclickTimeout;
  let lastFilterUsed = "";

  addEventListener(field, "keyup", function(e) {
    if (loading !== 2) return;

    // Handle up and down arrows

    const key = e.which ? e.which : e.keyCode;

    if (key == KEY_UP_ARROW || key == KEY_DOWN_ARROW) {
      if (!resultsList || filteredList.length === 0) return;

      if (resultsAreHidden()) {
        showResults();
        return;
      }

      let current = getElementsByClassName("gsma_current")[0];

      // if no element is selected as current, pick the first one

      if (!current) current = resutlsList.getElementsByTagName("a")[0];

      // find next element to be clicked (above or below the current one)

      let next =
        key == KEY_DOWN_ARROW
          ? current.parentElement.nextSibling
          : current.parentElement.previousSibling;

      // wrap around if needed

      if (!next)
        next =
          key == KEY_DOWN_ARROW
            ? resultsList.firstChild
            : resultsList.lastChild;

      // click that element

      if (next) {
        const link = next.getElementsByTagName("a")[0];
        if (link) triggerEvent("click", link);
      }

      return;
    }
    if (key == KEY_ESCAPE) {
      hideResults();
      return;
    }

    if (lastFilterUsed === field.value) {
      // do nothing if value of the search field hasn't changed (e.g. the keypress was caused by left arrow, contro, etc.)

      return;
    }

    lastFilterUsed = field.value;

    filteredList = filterPhones(field.value);
    setResultsList(filteredList);

    if (autoclickTimeout) clearTimeout(autoclickTimeout);

    autoclickTimeout = setTimeout(function() {
      triggerEvent("click", resultsList.getElementsByTagName("a")[0]);
    }, DELAY_BEFORE_AUTOCLICK);
  });

  // Hide widget when the text field loses focus (but keep focus if it was a link or the phone details that were clicked)

  let hideOnBlurTimeout;

  addEventListener(field, "blur", function() {
    hideOnBlurTimeout = setTimeout(function() {
      hideResults();
    }, 200);
  });

  addEventListener(field, "focus", function() {
    clearTimeout(hideOnBlurTimeout);
  });

  addEventListener(detail, "click", function() {
    field.focus();
  });
})();
