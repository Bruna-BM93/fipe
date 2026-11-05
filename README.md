# 🚗 Consulta Tabela FIPE

Aplicação web (HTML + CSS + JavaScript puro) que consulta o preço de veículos na Tabela FIPE usando a [BrasilAPI](https://brasilapi.com.br/).

## Funcionalidades
- Consulta de preço pelo **código FIPE** (`GET /api/fipe/preco/v1/{codigoFipe}`)
- Consulta guiada para quem não sabe o código: **Marca → Modelo → Ano → Preço**
  - `GET /api/fipe/marcas/v1/{tipoVeiculo}`
  - `GET /api/fipe/veiculos/v1/{tipoVeiculo}/{codigoMarca}`
  - `GET /api/fipe/anos/v1/{tipoVeiculo}/{codigoMarca}/{codigoModelo}`
  - `GET /api/fipe/detalhes/v1/{tipoVeiculo}/{codigoMarca}/{codigoModelo}/{codigoAno}`
- Indicador visual **"Processando requisição..."** (spinner) enquanto a API responde
- Tratamento de erros (código inexistente, falha de rede)

## Como usar
**Se você sabe o código FIPE:** digite no primeiro campo (ex.: `001004-9`) e clique em **Consultar**.

**Se não sabe:** escolha em sequência o **tipo → marca → modelo → ano**. O preço aparece sozinho no final, junto com o código FIPE do veículo.

Enquanto a consulta acontece, aparece uma rodinha girando com "Processando requisição...".

## Em linguagem simples
O site funciona como um atendente: você pergunta o preço de um carro, ele avisa que está consultando, busca a resposta na base oficial da FIPE (através da BrasilAPI) e mostra o valor em segundos.

## Como executar
Basta abrir o `index.html` no navegador, ou usar a extensão Live Server do VS Code. Não precisa instalar nada.

## Como funciona
1. O `fetch` faz a requisição à BrasilAPI dentro de uma função `async`.
2. Antes da requisição, o elemento `#loading` fica visível; no `finally`, ele é escondido de novo.
3. O JSON retornado é transformado em HTML e inserido na página.

Projeto de referência: [fabianooss/aula-javascript-request-api](https://github.com/fabianooss/aula-javascript-request-api)
