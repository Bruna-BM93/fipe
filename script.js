// URL base da BrasilAPI
const API = 'https://brasilapi.com.br/api/fipe';

// Elementos da página
const selectTipo = document.getElementById('tipoVeiculo');
const selectMarca = document.getElementById('marca');
const selectModelo = document.getElementById('modelo');
const selectAno = document.getElementById('ano');
const loading = document.getElementById('loading');
const erro = document.getElementById('erro');
const resultado = document.getElementById('resultado');

const TIPOS = { 1: 'Carro', 2: 'Moto', 3: 'Caminhão' };

// ---------- Ajudantes ----------

// Mostra/esconde o indicador "Processando requisição..."
function setLoading(ativo) {
  loading.classList.toggle('oculto', !ativo);
}

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.classList.remove('oculto');
}

function limparErro() {
  erro.textContent = '';
  erro.classList.add('oculto');
}

// Faz a requisição à API e devolve o JSON.
// Se o servidor estiver instável (erro 5xx), tenta mais uma vez.
async function buscar(url, tentativas = 2) {
  setLoading(true);
  limparErro();
  try {
    for (let i = 1; i <= tentativas; i++) {
      const resposta = await fetch(url, { cache: 'no-store' });
      const dados = await resposta.json().catch(() => ({}));
      if (resposta.ok) return dados;
      if (resposta.status < 500 || i === tentativas) {
        throw new Error(dados.message || `Erro ${resposta.status}`);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    setLoading(false); // some com o loading, dando certo ou errado
  }
}

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

// ---------- Passo 1 e 2: tipo -> marcas ----------
async function carregarMarcas() {
  resetar(selectMarca, 'Carregando marcas...');
  resetar(selectModelo, 'Escolha a marca primeiro');
  resetar(selectAno, 'Escolha o modelo primeiro');
  resultado.innerHTML = '';
  try {
    const marcas = await buscar(`${API}/marcas/v1/${selectTipo.value}`);
    preencher(selectMarca, marcas, 'Selecione a marca', 'nome');
  } catch (e) {
    resetar(selectMarca, 'Erro ao carregar');
    mostrarErro(`Não foi possível carregar as marcas: ${e.message}`);
  }
}

// ---------- Passo 3: marca -> modelos ----------
async function carregarModelos() {
  resetar(selectModelo, 'Escolha a marca primeiro');
  resetar(selectAno, 'Escolha o modelo primeiro');
  resultado.innerHTML = '';
  if (!selectMarca.value) return;
  try {
    const modelos = await buscar(`${API}/veiculos/v1/${selectTipo.value}/${selectMarca.value}`);
    preencher(selectModelo, modelos, 'Selecione o modelo', 'modelo');
  } catch (e) {
    mostrarErro(`Não foi possível carregar os modelos: ${e.message}`);
  }
}

// ---------- Passo 4: modelo -> anos ----------
async function carregarAnos() {
  resetar(selectAno, 'Escolha o modelo primeiro');
  resultado.innerHTML = '';
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

// ---------- Final: ano -> código FIPE + dados do carro ----------
async function consultarVeiculo() {
  resultado.innerHTML = '';
  if (!selectAno.value) return;
  try {
    const carro = await buscar(
      `${API}/detalhes/v1/${selectTipo.value}/${selectMarca.value}/${selectModelo.value}/${selectAno.value}`
    );
    mostrarFicha(carro);
  } catch (e) {
    mostrarErro(`Não foi possível consultar o veículo: ${e.message}`);
  }
}

// Monta a "ficha" do carro escolhido na tela
function mostrarFicha(carro) {
  const ano = carro.anoModelo === 32000 ? 'Zero km' : carro.anoModelo;
  resultado.innerHTML = `
    <article class="ficha">
      <div class="ficha-topo">
        <div>
          <small>Código FIPE</small>
          <div class="codigo">${carro.codigoFipe}</div>
          <button type="button" class="copiar" id="btnCopiar">Copiar código</button>
        </div>
        <div>
          <small>Preço médio</small>
          <div class="preco">${carro.valor}</div>
        </div>
      </div>
      <h3>${carro.marca} — ${carro.modelo}</h3>
      <dl>
        <div><dt>Marca</dt><dd>${carro.marca}</dd></div>
        <div><dt>Modelo</dt><dd>${carro.modelo}</dd></div>
        <div><dt>Ano modelo</dt><dd>${ano}</dd></div>
        <div><dt>Combustível</dt><dd>${carro.combustivel}</dd></div>
        <div><dt>Tipo</dt><dd>${TIPOS[carro.tipoVeiculo] || '-'}</dd></div>
        <div><dt>Mês de referência</dt><dd>${carro.mesReferencia}</dd></div>
      </dl>
    </article>
  `;

  document.getElementById('btnCopiar').addEventListener('click', async (ev) => {
    try {
      await navigator.clipboard.writeText(carro.codigoFipe);
      ev.target.textContent = 'Copiado!';
    } catch {
      ev.target.textContent = 'Não foi possível copiar';
    }
  });
}

// ---------- Eventos: cada escolha libera a próxima ----------
selectTipo.addEventListener('change', carregarMarcas);
selectMarca.addEventListener('change', carregarModelos);
selectModelo.addEventListener('change', carregarAnos);
selectAno.addEventListener('change', consultarVeiculo);

// Ao abrir a página, já carrega as marcas de carros
carregarMarcas();
