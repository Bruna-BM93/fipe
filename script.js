// URL base da BrasilAPI
const API = 'https://brasilapi.com.br/api/fipe';

// Elementos da página
const formPreco = document.getElementById('formPreco');
const inputCodigo = document.getElementById('codigoFipe');
const btnConsultar = document.getElementById('btnConsultar');
const selectTipo = document.getElementById('tipoVeiculo');
const selectMarca = document.getElementById('marca');
const listaModelos = document.getElementById('listaModelos');
const loading = document.getElementById('loading');
const erro = document.getElementById('erro');
const resultado = document.getElementById('resultado');

// Mostra/esconde o indicador "Processando requisição..."
function setLoading(ativo) {
  loading.classList.toggle('oculto', !ativo);
  btnConsultar.disabled = ativo;
}

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.classList.remove('oculto');
}

function limparErro() {
  erro.textContent = '';
  erro.classList.add('oculto');
}

// Função genérica: faz a requisição e devolve o JSON
async function buscar(url) {
  setLoading(true);
  limparErro();
  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dados.message || `Erro ${resposta.status}`);
    }
    return dados;
  } finally {
    setLoading(false);
  }
}

// ---------- 1) Consulta de preço pelo código FIPE ----------
formPreco.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const codigo = inputCodigo.value.trim();
  if (!codigo) return;

  resultado.innerHTML = '';
  try {
    const precos = await buscar(`${API}/preco/v1/${encodeURIComponent(codigo)}`);
    if (!precos.length) {
      mostrarErro('Nenhum veículo encontrado para esse código.');
      return;
    }
    mostrarPrecos(precos);
  } catch (e) {
    mostrarErro(`Não foi possível consultar: ${e.message}`);
  }
});

// A API devolve uma lista (um item por ano-modelo / combustível)
function mostrarPrecos(precos) {
  resultado.innerHTML = precos.map((p) => `
    <article class="resultado-item">
      <strong>${p.marca} — ${p.modelo}</strong>
      <p class="valor">${p.valor}</p>
      <dl>
        <dt>Ano modelo</dt><dd>${p.anoModelo === 32000 ? 'Zero km' : p.anoModelo}</dd>
        <dt>Combustível</dt><dd>${p.combustivel}</dd>
        <dt>Código FIPE</dt><dd>${p.codigoFipe}</dd>
        <dt>Referência</dt><dd>${p.mesReferencia}</dd>
      </dl>
    </article>
  `).join('');
}

// ---------- 2) Marcas e modelos ----------
async function carregarMarcas() {
  selectMarca.disabled = true;
  selectMarca.innerHTML = '<option value="">Carregando marcas...</option>';
  listaModelos.innerHTML = '';
  try {
    const marcas = await buscar(`${API}/marcas/v1/${selectTipo.value}`);
    selectMarca.innerHTML = '<option value="">Selecione a marca</option>' +
      marcas.map((m) => `<option value="${m.valor}">${m.nome}</option>`).join('');
    selectMarca.disabled = false;
  } catch (e) {
    selectMarca.innerHTML = '<option value="">Erro ao carregar</option>';
    mostrarErro(`Não foi possível carregar as marcas: ${e.message}`);
  }
}

async function carregarModelos() {
  listaModelos.innerHTML = '';
  if (!selectMarca.value) return;
  try {
    const modelos = await buscar(`${API}/veiculos/v1/${selectTipo.value}/${selectMarca.value}`);
    listaModelos.innerHTML = modelos
      .map((m) => `<li>${m.modelo ?? m.nome ?? m}</li>`)
      .join('');
  } catch (e) {
    mostrarErro(`Não foi possível carregar os modelos: ${e.message}`);
  }
}

selectTipo.addEventListener('change', carregarMarcas);
selectMarca.addEventListener('change', carregarModelos);

// Ao abrir a página, já carrega as marcas de carros
carregarMarcas();
