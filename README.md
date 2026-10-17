# 🎼 Montador de Cifras

Site estático (sem build) para montar cifras, transpor, imprimir em PDF, organizar repertórios e tocar no modo palco. Login e sincronização via **Supabase**; funciona offline como **PWA**.

## Estrutura do projeto
```
index.html          só a estrutura (HTML) e a ordem de carregamento
css/style.css       todos os estilos
js/                 a lógica, dividida por assunto (tabela abaixo)
sw.js               service worker (offline) — precisa ficar na raiz
manifest.json       configuração do PWA (instalar no celular)
icon.svg            ícone do app
vercel.json         cabeçalhos de segurança e cache (Vercel)
privacidade.html    política de privacidade e termos de uso
tests/              testes automáticos (rodar: node --test tests/*.test.js)
.github/workflows/  roda os testes a cada push no GitHub
supabase/schema.sql banco de dados (tabelas, RLS e funções)
```

| Arquivo | O que faz |
|---|---|
| `js/config.js` | Chaves do Supabase (edite aqui) |
| `js/state.js` | Estado global, biblioteca de músicas, salvamento local e busca |
| `js/render.js` | Transposição, graus, montagem da folha (HTML) e pré-visualização |
| `js/chords.js` | Diagramas de acordes (violão) e balão ao passar o mouse |
| `js/editor.js` | Editor por cartões: seções, arrastar e soltar, tom de saída |
| `js/importer.js` | Colar cifra: reconhecimento de acordes/seções e conversão texto ⇄ cartões |
| `js/song-options.js` | Imprimir, capotraste e quadro de acordes |
| `js/sets.js` | Repertórios (listas de músicas) |
| `js/stage.js` | Modo palco: rolagem, fonte, tela sempre acesa e atalhos |
| `js/library.js` | Ações da biblioteca: nova, duplicar, excluir, exportar e importar arquivo |
| `js/chordpro.js` | Exportar/importar ChordPro (.cho) |
| `js/history.js` | Desfazer / refazer |
| `js/modes.js` | Barra de visualização, modo Cartões/Texto e botões de partes |
| `js/settings.js` | Barra de topo, página de configurações e tema |
| `js/organize.js` | Ordenação da biblioteca e busca no repertório |
| `js/metronome.js` | Metrônomo do modo palco |
| `js/init.js` | Etiquetas, favorita e primeira renderização da interface |
| `js/pwa.js` | Registro do service worker (modo offline) |
| `js/auth.js` | Tela de login: entrar, criar conta, recuperar senha, Google |
| `js/sync.js` | Sincronização com o Supabase (push/pull, conflitos, sessão) |
| `js/share.js` | Compartilhar por link e visualizador de links |
| `js/trash.js` | Lixeira (restaurar músicas excluídas) |
| `js/account.js` | Sincronizar, sair, excluir conta e inicialização do login |
| `js/backup.js` | Lembrete e backup ao sair |
| `js/a11y.js` | Acessibilidade: rótulos, estados e diálogos |

> Os scripts são "clássicos" (sem `import`) e **a ordem de `<script>` no `index.html` importa**: cada arquivo usa funções e variáveis dos anteriores. Para mexer num assunto, abra só o arquivo dele.

## 1. Configurar o Supabase
1. Crie um projeto em https://supabase.com.
2. **SQL Editor → New query**: cole todo o `supabase/schema.sql` e clique **Run**. Ele cria as tabelas `cifras_items` e `cifras_shares` com **RLS ativo** (cada pessoa só acessa o que é dela), a função `delete_my_account` e a `get_share` (leitura pública de links).
3. **Project Settings → API**: copie a **Project URL** e a chave **anon/publishable** (nunca a `service_role`) para `SUPABASE_URL` e `SUPABASE_KEY` em `js/config.js`.
4. **Authentication → URL Configuration**: em *Site URL* e *Redirect URLs* coloque o endereço publicado (ex.: `https://seu-app.vercel.app/`).
5. (Opcional) **Authentication → Providers → Google**, para o botão "Continuar com Google".

### Conferir se a segurança (RLS) está ativa
No SQL Editor rode `select tablename, rowsecurity from pg_tables where tablename in ('cifras_items','cifras_shares');`. As duas linhas precisam mostrar `true`. Se aparecer `false`, qualquer usuário logado enxerga as cifras dos outros: rode o `supabase/schema.sql` de novo.

## 2. Publicar
**Vercel:** importe o repositório em https://vercel.com/new, *Framework Preset: Other*, sem build. Cada `git push` publica de novo.
**GitHub Pages:** *Settings → Pages → Branch: main / (root)*.

## Instalar no celular
- **Android (Chrome):** aparece o botão **⬇ Instalar** na barra do topo (ou *Configurações → Instalar no celular*). Também serve o menu ⋮ → *Instalar app*.
- **iPhone/iPad (Safari):** Compartilhar (□↑) → *Adicionar à Tela de Início*. O iOS não permite botão automático.
- Exige o site em **HTTPS** (Vercel e GitHub Pages já são).

## Recursos
- **Offline/PWA:** abra o site uma vez online; depois dá para instalar na tela inicial e usar sem internet. As alterações sincronizam ao voltar a conexão. Ao atualizar o app, aumente `V` em `sw.js` (ex.: `cifras-v3`); se criar um arquivo novo, inclua-o na lista `SHELL`.
- **Modo palco:** tela sempre acesa (Wake Lock), toque na letra para pausar/retomar a rolagem, **Ir para…** pula para uma seção, botão ⛶ de tela cheia (não existe no iPhone), `Espaço` rola/pausa, `←`/`→` trocam de música, `Esc` fecha.
- **Capotraste sugerido:** botão **🎸 Capo?** na barra da folha calcula a casa com mais acordes abertos e aplica se você quiser.
- **Gerenciar links:** *Configurações → Links compartilhados* lista, copia e apaga os links criados.
- **Compartilhar por link:** *⋯ Mais → Compartilhar esta* ou *Repertórios → Link*. Quem tem o link vê a cifra sem login e pode salvá-la na própria conta. O link é uma cópia (snapshot) e **qualquer pessoa com o link pode ler**.
- **Importar cifra:** cole em *Colar cifra*; reconhece `Intro: C G Am`, `Refrão (2x)`, acordes como `C7M`, `Dm7(b5)`, `Asus4`, e mantém tablaturas em fonte monoespaçada.
- **Lixeira:** músicas e repertórios excluídos ficam 30 dias em *⋯ Mais → Lixeira* e aparecem em todos os seus aparelhos.
- **Link ao vivo:** em *Repertórios → 🔴 Link ao vivo*. O link se atualiza sozinho quando você muda o repertório (alguns segundos depois) e quem o abre vê a versão mais nova, só para leitura (confere a cada minuto). Só o dono edita. Quem abre o link pode tocar em **🔗 Seguir repertório**: a conta dela ganha uma cópia que se atualiza sozinha quando o dono muda (as edições feitas na cópia são substituídas; *Repertórios → Parar de seguir* transforma a cópia em músicas normais). Exige rodar de novo o `supabase/schema.sql`.
- **Biblioteca grande:** ordenar por A–Z, recentes, artista ou tom; busca ao adicionar músicas no repertório.
- **Backup:** *Configurações → Backup ao sair* baixa um arquivo ao sair da conta; aviso depois de 30 dias sem backup.
- **Segurança:** `vercel.json` aplica cabeçalhos de segurança (CSP etc.). Se algo parar de carregar depois do deploy, abra o Console do navegador (F12): uma mensagem de CSP indica o que liberar, ou remova o cabeçalho `Content-Security-Policy` do arquivo.
- **ChordPro:** *⋯ Mais → Exportar ChordPro* gera um `.cho`; *Importar* também lê `.cho`, `.crd`, `.chordpro` e `.pro`.
- **Privacidade e termos:** página `privacidade.html`, ligada na tela de login. **Troque `[COLOQUE AQUI SEU E-MAIL]` pelo seu contato** e revise o texto.
- **Conflitos de sincronização:** se a mesma música for editada em dois aparelhos, a versão mais nova vence e a sua versão local é guardada como cópia "(versão local – conflito)".

## Dicas
- Para imprimir sem data e endereço, desmarque **Cabeçalhos e rodapés** na janela de impressão.
- Faça backup com **Exportar tudo** de vez em quando.

## Testes
```bash
node --test tests/*.test.js
```
Sem dependências (Node 18+). Cobrem o importador de cifras, a transposição, o capotraste sugerido e o ChordPro. Ao achar uma cifra que importa errado, copie-a para um teste novo em `tests/app.test.js` antes de corrigir o parser.
