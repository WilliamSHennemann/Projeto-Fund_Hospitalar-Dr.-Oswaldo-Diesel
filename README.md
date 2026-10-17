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

O build é estático (`dist/`) e pode ser servido pelo Nginx na VPS. Configure `CORS_ORIGIN` no backend para o domínio onde este frontend estiver publicado.

## Rotas para demonstração

- `/recepcao`, `/triagem`, `/enfermagem`, `/medico`, `/internacao` e `/raio-x`: pesquisa pública.
- `/admin/login`: acesso da equipe. Mock: `super@fundacao.com` / `super123` ou `ouvidoria@fundacao.com` / `ouvidoria123`.
- `/admin`: dashboard; o menu mostra apenas páginas permitidas para o perfil.
- `/admin/manifestacoes`: Ouvidoria e detalhes de contato.
- `/admin/perguntas`, `/admin/termo-imagem`, `/admin/setores`, `/admin/jobs`: gestão (Super Admin).
- `/tvwall`: painel público de indicadores, atualizado conforme `cache_seconds`.

## Estrutura

- `src/lib/api.ts`: único adaptador tipado, alternando API real/mock por ambiente.
- `src/lib/mock/`: dados de desenvolvimento em memória.
- `src/lib/permissions.ts`: matriz de permissões de interface.
- `docs/API_CONTRACT.md`: contrato consumido pelo frontend.
- `BACKEND_TODO.md`: lacunas a implementar no backend.
