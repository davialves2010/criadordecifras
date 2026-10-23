# Novidades (10 funcionalidades)

| # | Funcionalidade | Onde usar |
|---|---|---|
| 1 | Importar de sites de cifras | **Colar cifra** → campo **“Ou cole o link da cifra”** (Cifra Club e Cifras.com.br), ou cole o link direto na caixa de texto. Funciona só no site publicado na Vercel (usa `api/importar.js`). Alternativa para qualquer site: favorito “⭐ Cifra → Montador” em Configurações, ou copiar e colar o texto |
| 2 | Nota por música no repertório e duração total | Aba Repertórios: campo de nota em cada música; "⏱ Duração estimada" soma a duração das músicas. A nota aparece na folha, no palco, no PDF e nos links |
| 3 | Pedal Bluetooth | No palco: PageDown/PageUp rolam a página. Configurações → Modo palco → **Pedal Bluetooth** escolhe se ◀ ▶ trocam de música ou rolam a página |
| 4 | Rolagem automática por andamento | No palco: seletor ao lado de "Rolar": *Pelo andamento (BPM)* (cada linha de letra dura 1, 2 ou 4 compassos) ou *Pela duração* (usa a duração da música) |
| 5 | Busca por acordes | Na lista de músicas: `tom:G`, `acorde:Em,C`, `prog:C-G-Am-F`, misturando com palavras (`tom:G acorde:Em amor`) |
| 6 | Colaboração de banda | **📝 Anotações** (só suas, não vão em links, sobrevivem a "seguir" e à equipe) e **👥 Editar em equipe** (item 10) |
| 7 | Baixar PDF direto | Botão **📄 Baixar PDF** na tela da música (e no repertório aberto). A biblioteca jsPDF é baixada só na primeira vez |
| 8 | Metadados | Editar → Mais detalhes: **Duração** e **Link (YouTube/Spotify)**; aparece o botão 🎧 Ouvir |
| 9 | Histórico de versões | ⋯ Mais → **🕘 Versões anteriores** (últimas 15 por música, neste aparelho) |
| 10 | Editar em equipe | Aba Repertórios → **👥 Editar em equipe**: gera link de edição e link de leitura |

## Para ativar
1. Supabase → SQL Editor: rode o `supabase/schema.sql` inteiro (pode repetir).
2. Faça o deploy.
3. `node --test tests/*.test.js`

## Como funciona a equipe
- O dono ativa e envia o **link de edição**. Quem abre (e entra na conta) ganha uma cópia que se sincroniza a cada ~30 s e logo após cada edição.
- Cada música é comparada pelo campo `updated`: **vale a edição mais recente de cada música** (e do nome/ordem do repertório). Relógios muito diferentes entre aparelhos podem inverter a ordem.
- Favorita e anotações pessoais nunca vão para a nuvem compartilhada.
- "Parar de compartilhar" apaga o link; as cópias continuam com cada pessoa.

## Limites conhecidos
- Navegadores não deixam um site ler outro (CORS) e isso envolve direitos autorais; por isso a importação é por favorito, não por "colar URL".
- Rolagem por BPM é aproximada (altura média de uma linha ÷ duração de N compassos).
- Versões anteriores ficam só no aparelho (localStorage).

## Importar pelo link (Vercel)
- Arquivos: `api/importar.js` e `api/_extrair.js`. A Vercel publica sozinha, sem configurar nada.
- A função só aceita **https** e só os sites da lista (`cifraclub.com.br`, `cifraclub.com`, `cifras.com.br`). Para mudar a lista, crie a variável `IMPORT_HOSTS` na Vercel (ex.: `cifraclub.com.br,cifras.com.br`).
- **Recomendado:** crie na Vercel (Settings → Environment Variables) `SUPABASE_URL` e `SUPABASE_KEY` com os mesmos valores de `js/config.js`. Assim só quem está logado usa a função. Sem elas, qualquer pessoa que descubra o endereço consegue usá-la.
- Sites podem bloquear acessos automáticos (o app avisa e sugere copiar e colar). Essa busca é feita pelo servidor, a pedido de quem está logado, e nada é guardado nele.
