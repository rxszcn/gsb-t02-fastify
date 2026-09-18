// 复现脚本：GET 一切正常，HEAD 探同一个路径直接 500
const Fastify = require('../')

const f = Fastify({ exposeHeadRoutes: true })

f.get('/r', async () => new Response('hi there'))

;(async () => {
  await f.ready()
  for (const m of ['GET', 'HEAD']) {
    const r = await f.inject({ method: m, url: '/r' })
    console.log(m, r.statusCode, 'content-length=' + (r.headers['content-length'] ?? '-'))
    if (r.statusCode >= 500) console.log(r.body.slice(0, 260))
  }
  await f.close()
})()
