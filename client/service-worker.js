function getEndpoint () {
  return self.registration.pushManager.getSubscription()
    .then(function (subscription) {
      if (subscription) {
        return subscription.endpoint;
      }
      throw new Error('User not subscribed');
    });
}

// Register event listener for the 'push' event.
self.addEventListener('push', function (event) {
  console.log('push event');
  // Keep the service worker alive until the notification is created.
  event.waitUntil(
    getEndpoint()
      .then(function (endpoint) {
        // Retrieve the textual payload from the server using a GET request.
        // We are using the endpoint as an unique ID of the user for simplicity.
        return fetch('http://localhost:1337/getPayload?endpoint=' + endpoint);
      })
      .then(function (response) {
        return response.text();
      })
      .then(function (payload) {
        console.log("file: service-worker.js | line 25 | .then | payload", payload);
        // Show a notification with title 'ServiceWorker Cookbook' and use the payload
        // as the body.
        const channel = new BroadcastChannel('sw-messages');
        channel.postMessage({ id: payload });
        self.registration.showNotification('ServiceWorker Cookbook', {
          body: payload,
        });
      })
  );
});
