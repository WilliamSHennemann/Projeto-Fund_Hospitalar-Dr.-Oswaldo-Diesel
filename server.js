import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const indexFile = path.join(root, 'index.html')
const port = Number(process.env.PORT) || 10000
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

if (!existsSync(indexFile)) {
  throw new Error('Build do frontend não encontrado. Execute "npm run build" antes de iniciar o servidor.')
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  } catch {
    response.writeHead(400).end('URL inválida')
    return
  }

  const requestedFile = path.resolve(root, `.${pathname}`)
  if (requestedFile !== root && !requestedFile.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Acesso negado')
    return
  }

  const isFile = existsSync(requestedFile) && statSync(requestedFile).isFile()
  const file = isFile ? requestedFile : path.extname(pathname) ? null : indexFile
  if (!file) {
    response.writeHead(404).end('Não encontrado')
    return
  }

  response.writeHead(200, {
    'Cache-Control': 'no-cache',
    'Content-Type': mimeTypes[path.extname(file)] ?? 'application/octet-stream',
  })
  if (request.method === 'HEAD') {
    response.end()
    return
  }

  const stream = createReadStream(file)
  stream.on('error', error => {
    console.error('Falha ao servir arquivo do frontend:', error)
    if (!response.headersSent) response.writeHead(500).end('Erro ao servir arquivo')
    else response.destroy(error)
  })
  stream.pipe(response)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend disponível na porta ${port}`)
})
