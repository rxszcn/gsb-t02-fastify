'use strict'

const toString = Object.prototype.toString

function headRouteOnSendHandler (req, reply, payload, done) {
  // If payload is undefined
  if (payload === undefined) {
    reply.header('content-length', '0')
    done(null, null)
    return
  }

  // Response (web-api)
  // Unwrap it the same way onSendEnd does: apply its status code and
  // headers to the reply, then handle its body like any other payload.
  if (typeof payload === 'object' && toString.call(payload) === '[object Response]') {
    // https://developer.mozilla.org/en-US/docs/Web/API/Response/status
    if (typeof payload.status === 'number') {
      reply.code(payload.status)
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Response/headers
    if (typeof payload.headers === 'object' && typeof payload.headers.forEach === 'function') {
      for (const [headerName, headerValue] of payload.headers) {
        reply.header(headerName, headerValue)
      }
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Response/body
    // Keep going, body is either null or ReadableStream
    payload = payload.body
    if (payload === null) {
      reply.header('content-length', '0')
      done(null, null)
      return
    }
  }

  // node:stream
  if (typeof payload.resume === 'function') {
    payload.on('error', (err) => {
      reply.log.error({ err }, 'Error on Stream found for HEAD route')
    })
    payload.resume()
    done(null, null)
    return
  }

  // node:stream/web
  if (typeof payload.getReader === 'function') {
    payload.cancel('Stream cancelled by HEAD route').catch((err) => {
      reply.log.error({ err }, 'Error on Stream found for HEAD route')
    })
    done(null, null)
    return
  }

  const size = '' + Buffer.byteLength(payload)

  reply.header('content-length', size)

  done(null, null)
}

function parseHeadOnSendHandlers (onSendHandlers) {
  if (onSendHandlers == null) return headRouteOnSendHandler
  return Array.isArray(onSendHandlers)
    ? [...onSendHandlers, headRouteOnSendHandler]
    : [onSendHandlers, headRouteOnSendHandler]
}

module.exports = {
  parseHeadOnSendHandlers
}
