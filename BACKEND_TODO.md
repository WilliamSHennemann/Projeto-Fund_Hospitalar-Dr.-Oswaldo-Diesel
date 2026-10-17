# Pendências para o backend

1. Permitir contato consentido em pesquisa anônima, vincular `paciente_id` à pesquisa e limitar a exposição para Ouvidoria/Super Admin.
2. Implementar CRUD e reordenação de perguntas: `GET/POST/PUT/DELETE /admin/perguntas` e `PATCH /admin/perguntas/reordenar`.
3. Implementar termo de imagem: `GET /configuracoes/termo-imagem` e `PUT /admin/configuracoes/termo-imagem`.
4. Criar tentativas de contato com `GET/POST /manifestacoes/:id/tentativas`.
5. Disponibilizar limiares de NPS/média editáveis.
6. Gerar exportações reais em XLSX/PDF para download por blob.
7. Calcular turno pelo horário, em vez de fixar `manha`.
8. Criar opções de rostinhos para as perguntas 2–6.
9. Excluir perguntas NPS da média parcial.
10. Validar token da pesquisa nas rotas públicas que usam IDs e impor permissões por perfil no backend; revisar policies RLS.
11. Vincular manifestação ao contato consentido para retorno da Ouvidoria.
