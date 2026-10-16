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
| `js/history.js` | Desfazer / refazer |
| `js/modes.js` | Barra de visualização, modo Cartões/Texto e botões de partes |
| `js/settings.js` | Barra de topo, página de configurações e tema |
| `js/metronome.js` | Metrônomo do modo palco |
| `js/init.js` | Etiquetas, favorita e primeira renderização da interface |
| `js/pwa.js` | Registro do service worker (modo offline) |
| `js/auth.js` | Tela de login: entrar, criar conta, recuperar senha, Google |
| `js/sync.js` | Sincronização com o Supabase (push/pull, conflitos, sessão) |
| `js/share.js` | Compartilhar por link e visualizador de links |
| `js/trash.js` | Lixeira (restaurar músicas excluídas) |
| `js/account.js` | Sincronizar, sair, excluir conta e inicialização do login |

> Os scripts são "clássicos" (sem `import`) e **a ordem de `<script>` no `index.html` importa**: cada arquivo usa funções e variáveis dos anteriores. Para mexer num assunto, abra só o arquivo dele.

## 1. Configurar o Supabase
1. Crie um projeto em https://supabase.com.
2. **SQL Editor → New query**: cole todo o `supabase/schema.sql` e clique **Run**. Ele cria as tabelas `cifras_items` e `cifras_shares` com **RLS ativo** (cada pessoa só acessa o que é dela), a função `delete_my_account` e a `get_share` (leitura pública de links).
3. **Project Settings → API**: copie a **Project URL** e a chave **anon/publishable** (nunca a `service_role`) para `SUPABASE_URL` e `SUPABASE_KEY` em `js/config.js`.
4. **Authentication → URL Configuration**: em *Site URL* e *Redirect URLs* coloque o endereço publicado (ex.: `https://seu-app.vercel.app/`).
5. (Opcional) **Authentication → Providers → Google**, para o botão "Continuar com Google".

## 2. Publicar
**Vercel:** importe o repositório em https://vercel.com/new, *Framework Preset: Other*, sem build. Cada `git push` publica de novo.
**GitHub Pages:** *Settings → Pages → Branch: main / (root)*.

## Recursos
- **Offline/PWA:** abra o site uma vez online; depois dá para instalar na tela inicial e usar sem internet. As alterações sincronizam ao voltar a conexão. Ao atualizar o app, aumente `V` em `sw.js` (ex.: `cifras-v3`); se criar um arquivo novo, inclua-o na lista `SHELL`.
- **Modo palco:** tela sempre acesa (Wake Lock), `Espaço` rola/pausa, `←`/`→` trocam de música, `Esc` fecha.
- **Compartilhar por link:** *⋯ Mais → Compartilhar esta* ou *Repertórios → Link*. Quem tem o link vê a cifra sem login e pode salvá-la na própria conta. O link é uma cópia (snapshot) e **qualquer pessoa com o link pode ler**.
- **Importar cifra:** cole em *Colar cifra*; reconhece `Intro: C G Am`, `Refrão (2x)`, acordes como `C7M`, `Dm7(b5)`, `Asus4`, e mantém tablaturas em fonte monoespaçada.
- **Lixeira:** músicas excluídas ficam 30 dias (neste aparelho) em *⋯ Mais → Lixeira*.
- **Conflitos de sincronização:** se a mesma música for editada em dois aparelhos, a versão mais nova vence e a sua versão local é guardada como cópia "(versão local – conflito)".

## Dicas
- Para imprimir sem data e endereço, desmarque **Cabeçalhos e rodapés** na janela de impressão.
- Faça backup com **Exportar tudo** de vez em quando.
