# 🚗 Consulta Tabela FIPE

Aplicação web (HTML + CSS + JavaScript puro) que mostra o **código FIPE** e os **dados do veículo** escolhido, usando a [BrasilAPI](https://brasilapi.com.br/).

## Como usar
1. **Tipo:** clique em Carros, Motos ou Caminhões.
2. **Marca:** clique na marca (dá para digitar para filtrar).
3. **Modelo:** clique no modelo (também com busca).
4. **Ano:** clique no ano.

Aparece a ficha do veículo com o **código FIPE** (com botão para copiar), o **preço médio** e marca, modelo, ano, combustível, tipo e mês de referência.

Outros recursos:
- Barra de progresso: clique numa etapa anterior para voltar.
- Botões **Trocar ano** e **Nova consulta**.
- **Consultas recentes**: as últimas 5 consultas ficam salvas no navegador.
- Enquanto cada consulta acontece, aparece uma rodinha com "Processando requisição...".

## Em linguagem simples
O site funciona como um atendente: você escolhe o carro, ele avisa que está consultando, busca a resposta na base oficial da FIPE (através da BrasilAPI) e mostra o código e o valor em segundos.

## Rotas da BrasilAPI usadas
| Passo | Rota |
|---|---|
| Marcas | `GET /api/fipe/marcas/v1/{tipo}` |
| Modelos | `GET /api/fipe/veiculos/v1/{tipo}/{marca}` |
| Anos | `GET /api/fipe/anos/v1/{tipo}/{marca}/{modelo}` |
| Código FIPE e dados | `GET /api/fipe/detalhes/v1/{tipo}/{marca}/{modelo}/{ano}` |

## Como funciona
1. Cada escolha dispara um `fetch` à BrasilAPI dentro de uma função `async`.
2. Antes da requisição, o elemento `#loading` fica visível; no `finally`, ele é escondido de novo.
3. Se a API estiver instável (erro 5xx), o site tenta mais uma vez automaticamente.
4. O JSON retornado preenche a próxima lista ou monta a ficha do veículo.

## Como executar
Abra o `index.html` no navegador, ou use a extensão Live Server do VS Code. Não precisa instalar nada.

Projeto de referência: [fabianooss/aula-javascript-request-api](https://github.com/fabianooss/aula-javascript-request-api)
