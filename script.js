// URL base da BrasilAPI
const API = 'https://brasilapi.com.br/api/fipe';

// Elementos da página
const formPreco = document.getElementById('formPreco');
const inputCodigo = document.getElementById('codigoFipe');
const btnConsultar = document.getElementById('btnConsultar');
const selectTipo = document.getElementById('tipoVeiculo');
const selectMarca = document.getElementById('marca');
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

// ---------- 2) Consulta guiada: Marca -> Modelo -> Ano -> Preço ----------
const selectModelo = document.getElementById('modelo');
const selectAno = document.getElementById('ano');

// Preenche um <select> com a lista que veio da API
function preencher(select, itens, textoInicial, campoTexto) {
  select.innerHTML = `<option value="">${textoInicial}</option>` +
    itens.map((i) => `<option value="${i.valor}">${i[campoTexto]}</option>`).join('');
  select.disabled = false;
}

// Volta um <select> para o estado "aguardando o passo anterior"
function resetar(select, texto) {
  select.innerHTML = `<option value="">${texto}</option>`;
  select.disabled = true;
}

async function carregarMarcas() {
  resetar(selectMarca, 'Carregando marcas...');
  resetar(selectModelo, 'Escolha a marca primeiro');
  resetar(selectAno, 'Escolha o modelo primeiro');
  try {
    const marcas = await buscar(`${API}/marcas/v1/${selectTipo.value}`);
    preencher(selectMarca, marcas, 'Selecione a marca', 'nome');
  } catch (e) {
    resetar(selectMarca, 'Erro ao carregar');
    mostrarErro(`Não foi possível carregar as marcas: ${e.message}`);
  }
}

async function carregarModelos() {
  resetar(selectModelo, 'Escolha a marca primeiro');
  resetar(selectAno, 'Escolha o modelo primeiro');
  if (!selectMarca.value) return;
  try {
    const modelos = await buscar(`${API}/veiculos/v1/${selectTipo.value}/${selectMarca.value}`);
    preencher(selectModelo, modelos, 'Selecione o modelo', 'modelo');
  } catch (e) {
    mostrarErro(`Não foi possível carregar os modelos: ${e.message}`);
  }
}

async function carregarAnos() {
  resetar(selectAno, 'Escolha o modelo primeiro');
  if (!selectModelo.value) return;
  try {
    const anos = await buscar(
      `${API}/anos/v1/${selectTipo.value}/${selectMarca.value}/${selectModelo.value}`
    );
    preencher(selectAno, anos, 'Selecione o ano', 'nome');
  } catch (e) {
    mostrarErro(`Não foi possível carregar os anos: ${e.message}`);
  }
}

// Último passo: com marca, modelo e ano, busca o preço
async function consultarDetalhes() {
  if (!selectAno.value) return;
  resultado.innerHTML = '';
  try {
    const detalhe = await buscar(
      `${API}/detalhes/v1/${selectTipo.value}/${selectMarca.value}/${selectModelo.value}/${selectAno.value}`
    );
    mostrarPrecos([detalhe]); // a rota devolve um único objeto
    inputCodigo.value = detalhe.codigoFipe; // mostra o código FIPE descoberto
  } catch (e) {
    mostrarErro(`Não foi possível consultar o preço: ${e.message}`);
  }
}

selectTipo.addEventListener('change', carregarMarcas);
selectMarca.addEventListener('change', carregarModelos);
selectModelo.addEventListener('change', carregarAnos);
selectAno.addEventListener('change', consultarDetalhes);

// Ao abrir a página, já carrega as marcas de carros
carregarMarcas();
