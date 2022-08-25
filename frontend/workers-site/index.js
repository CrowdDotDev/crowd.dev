import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler'

// https://stackoverflow.com/questions/58432345/cloudflare-workers-spa-with-vuejs
// https://gist.github.com/simevidas/d8ec51a51b05d4fabee6ddbe90c938ce

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url);
  let options = { mapRequestToAsset: serveSinglePageApp };
  options.cacheControl = {
    // The KV should implement its own edge caching, so I will only set the browser's
    // https://stackoverflow.com/a/64299547
    //
    browserTTL: 0, //3600 * 26,
    bypassCache: false,
  };

  if (url.pathname.endsWith('.js')) {
    // 26 hours: if someone returns at the same time the next day they'll have 2 hours to work.
    options.cacheControl.browserTTL = 3600 * 26;
  }
  else {
    const filesRegex = /(.*\.(gif|jpeg|jpg|mp4|mpeg|png|svg|ttf|webp|woff|woff2))$/;
    if (url.pathname.match(filesRegex))
      options.cacheControl.browserTTL = 3600 * 24 * 30;
  }

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      }
    }
    return await getAssetFromKV(event, options)
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 })
  }
}

