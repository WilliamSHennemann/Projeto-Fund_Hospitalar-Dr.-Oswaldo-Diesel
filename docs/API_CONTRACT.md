# Contrato da API do SGEP

Base configurável por `VITE_API_URL` (por exemplo, `http://localhost:3000/api`). Erros seguem `{ "erro", "codigo", "detalhes" }`.

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

## Autenticado

O JWT vai no cabeçalho `Authorization: Bearer <token>`.

| Método | Rota |
|---|---|
| POST / GET | `/auth/login`, `/auth/me` |
| GET | `/dashboard/resumo`, `/dashboard/setores`, `/dashboard/setores/:id/turnos`, `/dashboard/em-andamento`, `/dashboard/equipes` |
| GET / PATCH | `/manifestacoes`, `/manifestacoes/:id` |
| GET | `/exportacoes/excel`, `/exportacoes/pdf` |
| GET / POST | `/admin/setores` |
| GET | `/admin/perfis`, `/admin/usuarios` |
| GET | `/jobs/abandono`, `/jobs/retencao` |

As rotas de perguntas, termo de imagem e tentativas de contato ainda são lacunas do backend e estão encapsuladas em `src/lib/api.ts` para facilitar a troca quando forem disponibilizadas.

## Compatibilidade verificada com o backend recebido

O backend responde em `http://localhost:3000/api` por padrão e atende as rotas centrais descritas acima. Há duas particularidades já consideradas pelo frontend: `POST /pesquisas` retorna `setor` como *slug* (não como objeto) e os endpoints administrativos de perguntas/termo/tentativas ainda não existem. O contato de uma avaliação anônima permanece bloqueado no backend; o frontend informa a falha de forma amigável até que a pendência seja corrigida.
