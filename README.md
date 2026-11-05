# 🚗 Consulta Tabela FIPE

Aplicação web (HTML + CSS + JavaScript puro) que consulta o preço de veículos na Tabela FIPE usando a [BrasilAPI](https://brasilapi.com.br/).

## Funcionalidades
- Consulta de preço pelo **código FIPE** (`GET /api/fipe/preco/v1/{codigoFipe}`)
- Listagem de **marcas** por tipo de veículo (`GET /api/fipe/marcas/v1/{tipoVeiculo}`)
- Listagem de **modelos** de uma marca (`GET /api/fipe/veiculos/v1/{tipoVeiculo}/{codigoMarca}`)
- Indicador visual **"Processando requisição..."** (spinner) enquanto a API responde
- Tratamento de erros (código inexistente, falha de rede)

## Como executar
Basta abrir o `index.html` no navegador, ou usar a extensão Live Server do VS Code.

Código para testar: `001004-9`

## Como funciona
1. O `fetch` faz a requisição à BrasilAPI dentro de uma função `async`.
2. Antes da requisição, o elemento `#loading` fica visível; no `finally`, ele é escondido de novo.
3. O JSON retornado é transformado em HTML e inserido na página.

Projeto de referência: [fabianooss/aula-javascript-request-api](https://github.com/fabianooss/aula-javascript-request-api)
