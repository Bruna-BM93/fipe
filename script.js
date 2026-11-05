// URL base da BrasilAPI
const API = 'https://brasilapi.com.br/api/fipe';

// O que o usuário já escolheu em cada etapa
const escolha = { tipo: null, marca: null, modelo: null, ano: null };
// Listas que vieram da API (guardadas para o filtro de busca)
let marcas = [];
let modelos = [];

const ETAPAS = ['tipo', 'marca', 'modelo', 'ano', 'resultado'];
const NOMES_TIPO = { carros: 'Carros', motos: 'Motos', caminhoes: 'Caminhões' };
const TIPO_VEICULO = { 1: 'Carro', 2: 'Moto', 3: 'Caminhão' };

const $ = (id) => document.getElementById(id);
const loading = $('loading');
const erro = $('erro');

// Evita que um texto vindo da API seja interpretado como HTML
function esc(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// ---------- Requisição com indicador de processamento ----------
async function buscar(url, tentativas = 2) {
  loading.classList.remove('oculto'); // mostra "Processando requisição..."
  erro.classList.add('oculto');
  try {
    for (let i = 1; i <= tentativas; i++) {
      const resposta = await fetch(url, { cache: 'no-store' });
      const dados = await resposta.json().catch(() => ({}));
      if (resposta.ok) return dados;
      // Erro 5xx = instabilidade no servidor: tenta mais uma vez
      if (resposta.status < 500 || i === tentativas) {
        throw new Error(dados.message || `Erro ${resposta.status}`);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    loading.classList.add('oculto'); // esconde, dando certo ou errado
  }
}

function mostrarErro(msg) {
  erro.textContent = msg;
  erro.classList.remove('oculto');
}

// ---------- Navegação entre etapas ----------
function irPara(etapa) {
  ETAPAS.forEach((nome) => $(`etapa-${nome}`).classList.toggle('oculto', nome !== etapa));

  const atual = ETAPAS.indexOf(etapa);
  document.querySelectorAll('.step').forEach((botao, i) => {
    botao.classList.toggle('feito', i < atual);
    botao.classList.toggle('atual', i === atual);
    botao.disabled = i >= atual; // só dá para voltar para etapas já feitas
  });

  atualizarTrilha();
  const busca = $(`busca${etapa[0].toUpperCase()}${etapa.slice(1)}`);
  if (busca) busca.focus();
}

// Mostra "Carros › Fiat › Uno › 2010"
function atualizarTrilha() {
  const partes = [
    escolha.tipo && NOMES_TIPO[escolha.tipo],
    escolha.marca?.nome,
    escolha.modelo?.modelo,
    escolha.ano?.nome,
  ].filter(Boolean);
  $('trilha').innerHTML = partes.map((p) => `<b>${esc(p)}</b>`).join(' › ');
}

document.querySelectorAll('.step').forEach((botao) => {
  botao.addEventListener('click', () => {
    const etapa = botao.dataset.step;
    // Ao voltar, apaga as escolhas das etapas seguintes
    const i = ETAPAS.indexOf(etapa);
    ['tipo', 'marca', 'modelo', 'ano'].slice(i).forEach((k) => { escolha[k] = null; });
    irPara(etapa);
  });
});

// Cria os botões de uma lista de opções
function desenharOpcoes(container, itens, campoTexto, aoClicar) {
  container.innerHTML = '';
  if (!itens.length) {
    container.innerHTML = '<p class="vazio">Nada encontrado com esse filtro.</p>';
    return;
  }
  itens.forEach((item) => {
    const botao = document.createElement('button');
    botao.textContent = item[campoTexto];
    botao.addEventListener('click', () => aoClicar(item));
    container.appendChild(botao);
  });
}

// Compara textos ignorando maiúsculas e acentos
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------- Etapa 1: tipo ----------
document.querySelectorAll('.tipo').forEach((botao) => {
  botao.addEventListener('click', () => escolherTipo(botao.dataset.tipo));
});

async function escolherTipo(tipo) {
  escolha.tipo = tipo;
  try {
    marcas = await buscar(`${API}/marcas/v1/${tipo}`);
    $('buscaMarca').value = '';
    filtrarMarcas();
    irPara('marca');
  } catch (e) {
    mostrarErro(`Não foi possível carregar as marcas: ${e.message}`);
  }
}

// ---------- Etapa 2: marca ----------
function filtrarMarcas() {
  const termo = normalizar($('buscaMarca').value);
  const filtradas = marcas.filter((m) => normalizar(m.nome).includes(termo));
  desenharOpcoes($('listaMarcas'), filtradas, 'nome', escolherMarca);
}
$('buscaMarca').addEventListener('input', filtrarMarcas);

async function escolherMarca(marca) {
  escolha.marca = marca;
  try {
    modelos = await buscar(`${API}/veiculos/v1/${escolha.tipo}/${marca.valor}`);
    $('buscaModelo').value = '';
    filtrarModelos();
    irPara('modelo');
  } catch (e) {
    mostrarErro(`Não foi possível carregar os modelos: ${e.message}`);
  }
}

// ---------- Etapa 3: modelo ----------
function filtrarModelos() {
  const termo = normalizar($('buscaModelo').value);
  const filtrados = modelos.filter((m) => normalizar(m.modelo).includes(termo));
  $('contaModelos').textContent = `${filtrados.length} de ${modelos.length} modelos`;
  desenharOpcoes($('listaModelos'), filtrados, 'modelo', escolherModelo);
}
$('buscaModelo').addEventListener('input', filtrarModelos);

async function escolherModelo(modelo) {
  escolha.modelo = modelo;
  try {
    const anos = await buscar(
      `${API}/anos/v1/${escolha.tipo}/${escolha.marca.valor}/${modelo.valor}`
    );
    // Troca "32000" (código da FIPE para zero km) por um texto legível
    anos.forEach((a) => { a.nome = a.nome.replace('32000', 'Zero km'); });
    desenharOpcoes($('listaAnos'), anos, 'nome', escolherAno);
    irPara('ano');
  } catch (e) {
    mostrarErro(`Não foi possível carregar os anos: ${e.message}`);
  }
}

// ---------- Etapa 4: ano -> código FIPE e dados ----------
async function escolherAno(ano) {
  escolha.ano = ano;
  try {
    const carro = await buscar(
      `${API}/detalhes/v1/${escolha.tipo}/${escolha.marca.valor}/${escolha.modelo.valor}/${ano.valor}`
    );
    mostrarFicha(carro);
    salvarRecente(carro);
    irPara('resultado');
  } catch (e) {
    mostrarErro(`Não foi possível consultar o veículo: ${e.message}`);
  }
}

// ---------- Etapa 5: ficha do veículo ----------
function mostrarFicha(carro) {
  const ano = carro.anoModelo === 32000 ? 'Zero km' : carro.anoModelo;
  $('ficha').innerHTML = `
    <article class="ficha">
      <div class="ficha-topo">
        <div>
          <small>Código FIPE</small>
          <div class="codigo">${esc(carro.codigoFipe)}</div>
          <button type="button" class="copiar" id="btnCopiar">Copiar código</button>
        </div>
        <div>
          <small>Preço médio FIPE</small>
          <div class="preco">${esc(carro.valor)}</div>
        </div>
      </div>
      <h3>${esc(carro.marca)} — ${esc(carro.modelo)}</h3>
      <dl>
        <div><dt>Marca</dt><dd>${esc(carro.marca)}</dd></div>
        <div><dt>Modelo</dt><dd>${esc(carro.modelo)}</dd></div>
        <div><dt>Ano modelo</dt><dd>${esc(String(ano))}</dd></div>
        <div><dt>Combustível</dt><dd>${esc(carro.combustivel)}</dd></div>
        <div><dt>Tipo</dt><dd>${TIPO_VEICULO[carro.tipoVeiculo] || '-'}</dd></div>
        <div><dt>Mês de referência</dt><dd>${esc(carro.mesReferencia)}</dd></div>
      </dl>
    </article>
  `;
  $('btnCopiar').addEventListener('click', async (ev) => {
    try {
      await navigator.clipboard.writeText(carro.codigoFipe);
      ev.target.textContent = 'Copiado! ✓';
    } catch {
      ev.target.textContent = 'Não foi possível copiar';
    }
  });
}

$('btnTrocarAno').addEventListener('click', () => { escolha.ano = null; irPara('ano'); });
$('btnNova').addEventListener('click', () => {
  Object.keys(escolha).forEach((k) => { escolha[k] = null; });
  irPara('tipo');
});

// ---------- Consultas recentes (ficam salvas no navegador) ----------
function lerRecentes() {
  try { return JSON.parse(localStorage.getItem('fipeRecentes')) || []; } catch { return []; }
}

function salvarRecente(carro) {
  const item = { codigo: carro.codigoFipe, nome: `${carro.marca} ${carro.modelo} ${carro.anoModelo === 32000 ? 'Zero km' : carro.anoModelo}`, valor: carro.valor };
  const lista = [item, ...lerRecentes().filter((r) => r.nome !== item.nome)].slice(0, 5);
  try { localStorage.setItem('fipeRecentes', JSON.stringify(lista)); } catch { /* navegador sem armazenamento */ }
  desenharRecentes(lista);
}

function desenharRecentes(lista = lerRecentes()) {
  $('recentes').classList.toggle('oculto', !lista.length);
  $('listaRecentes').innerHTML = lista.map((r) => `
    <li><span>${esc(r.nome)} · <span class="cod">${esc(r.codigo)}</span></span><b>${esc(r.valor)}</b></li>
  `).join('');
}

// ---------- Início ----------
desenharRecentes();
irPara('tipo');
