# PROJETO 07 - DESENVOLVIMENTO WEB III (SISTEMA DE GERENCIAMENTO DE LIVROS – CRUD + API)

Aplicação Web desenvolvida em **Node.js, NPM, HTML, CSS e JavaScript (sem frameworks)** com persistência em **SQLite** e integração com a **Open Library Search API** (FATEC Diadema — DSM 3º Semestre, Prof. Vinicius Heltai Pacheco).

---

## 🎯 Funcionalidades

- **CRUD Completo de Livros (`/api/livros`)**:
  - Campos: `id`, `titulo`, `autor`, `isbn`, `ano`, `genero` e `status` (`Quero ler`, `Lendo`, `Concluído`).
  - Endpoints REST: `GET /api/livros`, `GET /api/livros?id=:id`, `POST /api/livros`, `PUT /api/livros?id=:id`, `DELETE /api/livros?id=:id`.
- **Integração com Open Library Search API (`https://openlibrary.org/search.json`)**:
  - Auto-preenchimento de Título, Autor, ISBN, Ano de Publicação e Gênero a partir de pesquisa por título ou ISBN, com fallback manual caso a API externa não encontre o livro.
- **Front-end com CSS e JS externos (`public/style.css`, `public/script.js`)** utilizando `fetch()`, validação de campos e confirmação antes da exclusão.

---

## 🚀 Como Executar

```bash
npm start
# Acesse http://localhost:3000 no navegador
```
