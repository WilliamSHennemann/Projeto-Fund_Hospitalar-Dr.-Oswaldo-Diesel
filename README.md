# SGEP — Frontend

Frontend do Sistema de Gestão da Experiência do Paciente da Fundação Hospitalar Dr. Oswaldo Diesel.

## Executar

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

`VITE_API_URL` define a base da API. Use `VITE_USE_MOCK=true` para trabalhar sem backend; o mock em memória contém setores, fluxo de exemplo, indicadores e os dois logins de teste.

```bash
npm run build
npm run test
```

O build é estático (`dist/`) e pode ser servido pelo Nginx na VPS ou pelo servidor Node incluído (`npm start`). Configure `CORS_ORIGIN` no backend para o domínio onde este frontend estiver publicado.

## Publicar no Render

Publique o backend e o frontend como **Web Services** separados. No serviço do frontend, use o comando de build `npm install && npm run build` e o comando de inicialização `npm start`. O servidor incluído entrega os arquivos de `dist`, escuta na porta `PORT` fornecida pelo Render e encaminha rotas do React para `index.html`; não é necessário configurar rewrite nem diretório de publicação.

No Web Service do frontend, configure estas variáveis de ambiente:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | URL pública do Web Service do backend, terminando em `/api`, por exemplo `https://sgep-api.onrender.com/api` |
| `VITE_USE_MOCK` | `false` |

As variáveis `VITE_*` são incorporadas durante o build. Salve as variáveis e faça um novo deploy do frontend depois de alterá-las.

No Web Service do backend, configure `CORS_ORIGIN` com a URL pública exata do frontend, por exemplo `https://sgep-frontend.onrender.com`. Configure também a variável de conexão do PostgreSQL e o segredo JWT com os nomes que o código do backend realmente lê (nomes comuns são `DATABASE_URL` e `JWT_SECRET`). Gere um segredo JWT longo e aleatório; não reutilize esse valor no frontend. O Render fornece `PORT` automaticamente, então o servidor deve escutar essa variável.

O código do backend não está neste repositório, portanto confirme os nomes das variáveis de banco e JWT no `.env.example` ou no código do backend antes de cadastrar esses valores no Render. O frontend valida `VITE_API_URL` na inicialização quando `VITE_USE_MOCK=false` e mostra uma mensagem clara se a URL estiver ausente ou inválida.

## Rotas para demonstração

- `/recepcao`, `/triagem`, `/enfermagem`, `/medico`, `/internacao` e `/raio-x`: pesquisa pública.
- `/admin/login`: acesso da equipe. Mock: `super@fundacao.com` / `super123` ou `ouvidoria@fundacao.com` / `ouvidoria123`.
- `/admin`: dashboard; o menu mostra apenas páginas permitidas para o perfil.
- `/admin/manifestacoes`: Ouvidoria e detalhes de contato.
- `/admin/perguntas`, `/admin/setores`: gestão administrativa conforme permissões.
- `/tvwall`: painel público de indicadores, atualizado conforme `cache_seconds`.

## Estrutura

- `src/lib/api.ts`: único adaptador tipado, alternando API real/mock por ambiente.
- `src/lib/mock/`: dados de desenvolvimento em memória.
- `src/lib/permissions.ts`: matriz de permissões de interface.
- `docs/API_CONTRACT.md`: contrato consumido pelo frontend.
- `BACKEND_TODO.md`: lacunas a implementar no backend.
