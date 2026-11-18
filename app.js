import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function getRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk.toString()));
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function serveStaticFile(response, file) {
  fs.readFile(file, (err, data) => {
    if (err) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end('404 - Página Não Encontrada');
    }
    const ext = path.extname(file).toLowerCase();
    response.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream'
    });
    response.end(data);
  });
}

async function callback(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const method = request.method;

  // Endpoints REST: /api/livros
  if (pathname.startsWith('/api/livros')) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    const id = url.searchParams.get('id') || pathname.split('/')[3] || null;

    // POST /api/livros (CREATE)
    if (method === 'POST') {
      try {
        const data = await getRequestBody(request);
        if (!data.titulo || !data.autor) {
          return response
            .writeHead(400)
            .end(JSON.stringify({ error: 'Os campos Título e Autor são obrigatórios.' }));
        }

        const statusValidos = ['Quero ler', 'Lendo', 'Concluído'];
        const status = statusValidos.includes(data.status) ? data.status : 'Quero ler';

        const sql = `
          INSERT INTO livros (titulo, autor, isbn, ano, genero, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.run(
          sql,
          [
            data.titulo.trim(),
            data.autor.trim(),
            data.isbn || '',
            data.ano ? Number(data.ano) : null,
            data.genero || 'Geral',
            status
          ],
          function (err) {
            if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
            response
              .writeHead(201)
              .end(JSON.stringify({ id: this.lastID, message: 'Livro cadastrado com sucesso!' }));
          }
        );
      } catch (err) {
        response.writeHead(400).end(JSON.stringify({ error: 'Payload JSON inválido.' }));
      }
      return;
    }

    // GET /api/livros (READ)
    if (method === 'GET') {
      if (id) {
        db.get('SELECT * FROM livros WHERE id = ?', [id], (err, row) => {
          if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
          if (!row) return response.writeHead(404).end(JSON.stringify({ error: 'Livro não encontrado.' }));
          response.writeHead(200).end(JSON.stringify(row));
        });
      } else {
        db.all('SELECT * FROM livros ORDER BY id DESC', [], (err, rows) => {
          if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
          response.writeHead(200).end(JSON.stringify(rows));
        });
      }
      return;
    }

    // PUT /api/livros (UPDATE)
    if (method === 'PUT' && id) {
      try {
        const data = await getRequestBody(request);
        if (!data.titulo || !data.autor) {
          return response
            .writeHead(400)
            .end(JSON.stringify({ error: 'Os campos Título e Autor são obrigatórios.' }));
        }

        const sql = `
          UPDATE livros
          SET titulo = ?, autor = ?, isbn = ?, ano = ?, genero = ?, status = ?
          WHERE id = ?
        `;
        const params = [
          data.titulo.trim(),
          data.autor.trim(),
          data.isbn || '',
          data.ano ? Number(data.ano) : null,
          data.genero || 'Geral',
          data.status || 'Quero ler',
          id
        ];

        db.run(sql, params, function (err) {
          if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
          response.writeHead(200).end(JSON.stringify({ message: 'Livro atualizado com sucesso!' }));
        });
      } catch (err) {
        response.writeHead(400).end(JSON.stringify({ error: 'Payload inválido.' }));
      }
      return;
    }

    // DELETE /api/livros (DELETE)
    if (method === 'DELETE' && id) {
      db.run('DELETE FROM livros WHERE id = ?', [id], function (err) {
        if (err) return response.writeHead(500).end(JSON.stringify({ error: err.message }));
        response.writeHead(200).end(JSON.stringify({ message: 'Livro removido com sucesso!' }));
      });
      return;
    }
  }

  const file = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(publicDir)) {
    response.writeHead(403).end('Proibido');
    return;
  }

  serveStaticFile(response, file);
}

const server = http.createServer(callback);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sistema de Gerenciamento de Livros (Projeto 07 - DWIII) iniciado em http://localhost:${PORT}/`);
});
