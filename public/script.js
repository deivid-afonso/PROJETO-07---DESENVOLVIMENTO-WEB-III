const formLivro = document.getElementById('formLivro');
const tabelaLivros = document.getElementById('tabelaLivros');
const msgFeedback = document.getElementById('msgFeedback');
const statusOpenLibrary = document.getElementById('statusOpenLibrary');
const btnCancelar = document.getElementById('btnCancelar');

function exibirMensagem(elemento, texto, sucesso = true) {
  elemento.style.display = 'block';
  elemento.style.background = sucesso ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)';
  elemento.textContent = texto;
}

// Integração com a Open Library Search API (https://openlibrary.org/dev/docs/api/search)
document.getElementById('btnBuscarOpenLibrary').addEventListener('click', async () => {
  const termo = document.getElementById('termoOpenLibrary').value.trim();
  if (!termo) {
    exibirMensagem(statusOpenLibrary, 'Digite um título ou ISBN para pesquisar na Open Library.', false);
    return;
  }

  exibirMensagem(statusOpenLibrary, 'Consultando Open Library API...', true);

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha na resposta da Open Library API.');
    const data = await res.json();

    if (!data.docs || data.docs.length === 0) {
      exibirMensagem(
        statusOpenLibrary,
        'Nenhum resultado encontrado na Open Library. Você pode preencher os campos manualmente abaixo.',
        false
      );
      return;
    }

    const doc = data.docs[0];
    document.getElementById('titulo').value = doc.title || termo;
    document.getElementById('autor').value = (doc.author_name && doc.author_name[0]) || 'Autor Desconhecido';
    document.getElementById('isbn').value = (doc.isbn && doc.isbn[0]) || '';
    document.getElementById('ano').value = doc.first_publish_year || '';
    document.getElementById('genero').value = (doc.subject && doc.subject[0]) || 'Literatura / Técnico';

    exibirMensagem(
      statusOpenLibrary,
      `Dados preenchidos via Open Library: "${doc.title}". Confira e clique em Salvar Livro!`,
      true
    );
  } catch (err) {
    exibirMensagem(
      statusOpenLibrary,
      'API Open Library indisponível no momento. Preencha os dados manualmente no formulário (fallback ativo).',
      false
    );
  }
});

// Listar Livros (GET /api/livros)
async function carregarLivros() {
  const res = await fetch('/api/livros');
  const livros = await res.json();

  tabelaLivros.innerHTML = livros
    .map(
      (l) => `
    <tr>
      <td>#${l.id}</td>
      <td><strong>${l.titulo}</strong></td>
      <td>${l.autor}</td>
      <td>${l.isbn || '-'}</td>
      <td>${l.ano || '-'}</td>
      <td>${l.genero || '-'}</td>
      <td><span class="badge">${l.status}</span></td>
      <td>
        <button class="btn btn-edit" onclick="prepararEdicao(${l.id})">Editar</button>
        <button class="btn btn-del" onclick="excluirLivro(${l.id}, '${l.titulo.replace(/'/g, "\\'")}')">Excluir</button>
      </td>
    </tr>
  `
    )
    .join('');
}

// Criar ou Atualizar Livro (POST / PUT /api/livros)
formLivro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('livroId').value;
  const payload = {
    titulo: document.getElementById('titulo').value.trim(),
    autor: document.getElementById('autor').value.trim(),
    isbn: document.getElementById('isbn').value.trim(),
    ano: document.getElementById('ano').value,
    genero: document.getElementById('genero').value.trim(),
    status: document.getElementById('status').value
  };

  const url = id ? `/api/livros?id=${id}` : '/api/livros';
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  exibirMensagem(msgFeedback, data.message || data.error, res.ok);
  if (res.ok) {
    resetarFormulario();
    carregarLivros();
  }
});

window.prepararEdicao = async function (id) {
  const res = await fetch(`/api/livros?id=${id}`);
  const l = await res.json();
  document.getElementById('livroId').value = l.id;
  document.getElementById('titulo').value = l.titulo || '';
  document.getElementById('autor').value = l.autor || '';
  document.getElementById('isbn').value = l.isbn || '';
  document.getElementById('ano').value = l.ano || '';
  document.getElementById('genero').value = l.genero || '';
  document.getElementById('status').value = l.status || 'Quero ler';
  document.getElementById('tituloForm').textContent = `2. Editando Livro #${l.id}`;
  btnCancelar.style.display = 'inline-block';
};

window.excluirLivro = async function (id, titulo) {
  if (!confirm(`Tem certeza que deseja excluir o livro "${titulo}" (#${id})?`)) return;
  const res = await fetch(`/api/livros?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  exibirMensagem(msgFeedback, data.message || data.error, res.ok);
  carregarLivros();
};

function resetarFormulario() {
  formLivro.reset();
  document.getElementById('livroId').value = '';
  document.getElementById('tituloForm').textContent = '2. Cadastrar / Editar Livro';
  btnCancelar.style.display = 'none';
}

btnCancelar.addEventListener('click', resetarFormulario);

carregarLivros();
