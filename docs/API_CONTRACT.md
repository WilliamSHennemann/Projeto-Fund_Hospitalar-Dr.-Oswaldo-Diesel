# Contrato da API do SGEP

Base configurável por `VITE_API_URL` (por exemplo, `http://localhost:3000/api`). Erros seguem `{ "erro", "codigo", "detalhes" }`. Após a criação de uma pesquisa, as chamadas relacionadas a ela enviam `X-Pesquisa-Token` com o token retornado pela API.

## Público

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/setores` | Lista setores ativos |
| GET | `/setores/:slug` | Obtém um setor |
| GET | `/setores/:slug/fluxo` | Obtém setor e perguntas ordenadas |
| GET | `/setores/:slug/perguntas/:n` | Obtém pergunta isolada |
| POST | `/pesquisas` | Inicia avaliação anônima |
| PUT | `/pesquisas/:id/respostas/:perguntaId` | Salva resposta idempotente |
| POST | `/pesquisas/:id/finalizar` | Fecha a pesquisa |
| POST | `/pesquisas/:id/paciente` | Registra contato com consentimento |
| POST | `/pesquisas/:id/manifestacoes` | Registra elogio, reclamação ou sugestão |
| GET | `/tvwall` | Indicadores públicos da TV Wall |

`POST /pesquisas` envia `setor_id`, `anonimo`, `consentimento` e `data_atendimento` (`YYYY-MM-DD`). `data_atendimento` é persistida pelo backend; a data/hora de envio da avaliação também é registrada automaticamente.

As respostas numéricas enviam `pergunta_id`, `valor` e `opcao_id`. Respostas de texto enviam somente `pergunta_id` e `texto`. Ao responder a última pergunta, o cliente chama `POST /pesquisas/:id/finalizar` e usa o campo `destino` (`ouvidoria` ou `agradecimento`) retornado pela API para decidir a próxima tela.

## Autenticado

O JWT vai no cabeçalho `Authorization: Bearer <token>`.

| Método | Rota |
|---|---|
| POST | `/auth/login` |
| GET | `/auth/me` |
| GET | `/dashboard/resumo`, `/dashboard/setores`, `/dashboard/setores/:id/turnos`, `/dashboard/em-andamento`, `/dashboard/equipes` |
| GET / PATCH | `/manifestacoes`, `/manifestacoes/:id` |
| GET | `/exportacoes/excel`, `/exportacoes/pdf` |
| GET / POST | `/admin/setores` |
| PATCH / DELETE | `/admin/setores/:id` |
| GET / POST / PUT / DELETE | `/admin/perguntas`, `/admin/perguntas/:id` |
| PATCH | `/admin/perguntas/reordenar` |
| GET | `/admin/perfis`, `/admin/usuarios` |

Os indicadores do dashboard aceitam filtros opcionais de período e setor (`inicio`, `fim` e `setor_id`). O módulo de termo de imagem foi removido do frontend por não fazer parte do fluxo de avaliação.

Ao criar uma pergunta, `ordem` é opcional: quando ela não é enviada, o backend a calcula automaticamente. Perguntas `rostinho` usam cinco opções fixas (valores 1 a 5); perguntas `texto` não enviam opções; perguntas `multipla` enviam `opcoes` no formato `[{ valor, rotulo, emoji? }]`, com ao menos duas opções e valores únicos.

## Compatibilidade verificada com o backend recebido

O backend responde em `http://localhost:3000/api` por padrão e atende as rotas centrais descritas acima. `POST /pesquisas` retorna `setor` como *slug* (não como objeto), formato que o frontend aceita. Para uso em produção, o backend deve fornecer o CRUD administrativo de perguntas, aceitar o contato voluntário com consentimento explícito e validar o token da pesquisa nas rotas públicas protegidas.
