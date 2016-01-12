//////

this.addEventListener('install', function(event) {
  event.waitUntil(
    caches.delete('v1').then(function() {
      caches.open('v1').then(function(cache) {
        return cache.addAll([
          'index.html',
          'index.build.js',
          'resources/item-logo.png',
          'resources/toolbar-logo.png',
          'callback.html',
          'https://fonts.googleapis.com/css?family=RobotoDraft:regular,bold,italic,thin,light,bolditalic,black,medium&lang=en'
        ]);
      })
    })
  );
});

// this.addEventListener('activate', function(event) {
//   event.waitUntil(caches.delete('v1'));
// });

this.addEventListener('fetch', function(event) {
  event.respondWith(cachedFetch(possiblyRedirect(event.request)));
});

var possiblyRedirect = function(request) {
  // if (new URL(request.url).pathname.split('/').pop() === 'index.sw.html') {
  //   request = new Request('index.sw.html');
  //   console.log('SW: redirected request:', request.url);
  // }
  if (request.url.startsWith('http://fonts.googleapis.com')) {
    request = new Request(request.url.replace(/^http/, 'https'));
  }
  return request;
};

var cachedFetch = function(request) {
  return caches.match(request).then(function(response) {
    if (response) {
      // console.log('CACHE: got [' + request.url + ']');
      return response;
    } else {
      return fetch(request).then(function(response) {
        // console.log('NETWORK: got [' + request.url + ']');
        possiblyCache(request, response);
        return response;
      }).catch(function(error) {
        console.error('fetch failed:', error);
        throw error;
      });
    }
  });
};

var possiblyCache = function(request, response) {
  var type = responseType(request, response);
  if (type === 'image') {
    // console.log('SW: NOCACHE [' + type + ']: ' + request.url);
  } else {
    if (!response.bodyUsed) {
      caches.open('v1').then(function(cache) {
        cache.put(request, response.clone());
        // console.log('SW: cache [' + type + ']: ' + request.url);
      });
    }
  }
};

var responseType = function(request, response) {
  // TODO(sjmiles): would like to type-sniff via MIME but headers always empty
  //console.log(response.headers);
  //var type = response.headers.get('Content-Type');
  //type = (type || '').split('/').shift();
  var type = '';
  var ext = new URL(request.url).pathname.split('/').pop().split('.').pop().toLowerCase();
  switch(ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      type = 'image';
      break;
  }
  return type;
};

self.addEventListener("message", function(e) {
  var fn = commands[e.data.command];
  if (fn) {
    var ret = fn.call(this, e.data);
    clients.matchAll().then(function(c) {
      c[0].postMessage(ret);
    });
  } else {
    console.error('[sw] Unknown command:', e.data.command);
  }
});

var commands = {

  saveTrack: function(data) {
    return caches.open('v1').then(function(cache) {
      return cache.addAll(data.files);
    });
  },

  deleteTrack: function(data) {
    return caches.open('v1').then(function(cache) {
      return Promise.all(data.files.map(function(file) {
        return cache.delete(file);
      }));
      // return cache.keys().then(function(response) {
      //   return response.forEach(function(element) {
      //     return cache.delete(element);
      //   });
      // });
    });
  }

};
