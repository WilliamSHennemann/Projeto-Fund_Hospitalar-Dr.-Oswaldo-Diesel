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
| POST | `/pesquisas/:id/manifestacoes` | Registra elogio, reclamação ou sugestão |

`POST /pesquisas` envia `setor_id`, `anonimo`, `consentimento` e opcionalmente `data_atendimento` (`YYYY-MM-DD`). A data/hora de envio da avaliação também é registrada automaticamente.

As respostas numéricas enviam `pergunta_id`, `valor` e `opcao_id`. Respostas de texto enviam somente `pergunta_id` e `texto`. Após a última pergunta, o cliente finaliza e leva todos os pacientes à tela opcional `/pesquisa/:slug/final`; `destino` orienta apenas o texto e a categoria inicial sugerida.

`POST /pesquisas/:id/manifestacoes` envia `{ tipo, descricao, contato? }` com `X-Pesquisa-Token`. `tipo` aceita `elogio`, `reclamacao` ou `sugestao`. A descrição aceita 0–2000 caracteres e exige pelo menos 5 caracteres quando não há contato. `contato` é opcional e tem `{ nome?, telefone, consentimento: true }`; o telefone aceita 10 ou 11 dígitos após normalização. Resposta 201: `{ id, tipo, status, contato_registrado }`. Os códigos possíveis incluem `VALIDATION_ERROR` (400), `MANIFESTACAO_LIMITE` (409; máximo de 3 por pesquisa) e `RATE_LIMITED` (429).

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
| POST / PATCH / DELETE | `/admin/usuarios`, `/admin/usuarios/:id` |
| PATCH / POST | `/admin/usuarios/:id/senha`, `/admin/usuarios/:id/reativar` |
| POST | `/auth/senha` |
| GET | `/tvwall` (autenticado) |
| GET | `/tvwall/publico?chave=...` (TV com chave) |

`GET /manifestacoes` aceita `status`, `tipo`, `limit` e `offset`; retorna uma lista e o total em `X-Total-Count`. Respostas de pesquisa incluem `pergunta_texto`. A ordem prioriza registros abertos.

`POST /admin/usuarios` aceita `perfil` (`gestao`, `ouvidoria`, `visualizador` ou `admin_setor`). O setor é exigido para `gestao` e `admin_setor`. `GET /admin/usuarios?incluir_inativos=true` inclui acessos removidos, identificados por `ativo`. A senha de outro usuário pode ser redefinida por `PATCH /admin/usuarios/:id/senha` com `{ senha }` (8–72 caracteres); acessos removidos podem ser reativados via `POST /admin/usuarios/:id/reativar`. A própria senha é alterada por `POST /auth/senha` com `{ senha_atual, nova_senha }`.

O frontend espera que operações de criação e gestão de usuários sejam restritas a `super_admin`, que o setor informado esteja ativo e que e-mails sejam únicos, inclusive entre acessos removidos.

`PATCH /admin/usuarios/:id` permite somente a `super_admin` editar os campos `nome`, `email` e `setor_id` do gestor. A requisição é parcial e deve conter somente os campos alterados; a resposta contém o usuário atualizado sem senha/hash, com perfil `gestao`, `setor_id` e permissões. O setor escolhido deve estar ativo e o e-mail não pode estar cadastrado por outro usuário.

`GET /tvwall` exige autenticação. Para usuários com perfil `gestao`, os indicadores retornados são limitados ao setor vinculado à conta. `/tvwall?chave=...` usa a rota pública e não exige sessão da equipe.

### Exportações

`GET /exportacoes/excel` e `GET /exportacoes/pdf` aceitam os filtros opcionais `inicio` e `fim` (`YYYY-MM-DD`, com `inicio ≤ fim`) e `setor_id` (inteiro positivo). As duas rotas exigem autenticação e a permissão `exportacoes`. Retornam um arquivo anexo com o resumo por setor (Setor, Total de pesquisas, Média das avaliações e NPS), sem respostas individuais ou manifestações. A resposta inclui `Content-Disposition` e `X-Exportacao-Id`; o frontend gera o nome localmente porque o CORS pode não expor esses cabeçalhos.

Os indicadores do dashboard aceitam filtros opcionais de período e setor (`inicio`, `fim` e `setor_id`). O módulo de termo de imagem foi removido do frontend por não fazer parte do fluxo de avaliação.

Ao criar uma pergunta, `ordem` é opcional: quando ela não é enviada, o backend a calcula automaticamente. Perguntas `rostinho` usam cinco opções fixas (valores 1 a 5); perguntas `texto` não enviam opções; perguntas `multipla` enviam `opcoes` no formato `[{ valor, rotulo, emoji? }]`, com ao menos duas opções e valores únicos.

## Compatibilidade verificada com o backend recebido

O backend responde em `http://localhost:3000/api` por padrão e atende as rotas centrais descritas acima. `POST /pesquisas` retorna `setor` como *slug* (não como objeto), formato que o frontend aceita. Para uso em produção, o backend deve fornecer o CRUD administrativo de perguntas, aceitar o contato voluntário com consentimento explícito e validar o token da pesquisa nas rotas públicas protegidas.
