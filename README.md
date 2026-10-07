# 🎼 Montador de Cifras

Site estático (um único arquivo `index.html`, sem build nem dependências) para montar cifras, transpor, imprimir em PDF, organizar repertórios e tocar no modo palco.

As músicas ficam salvas no `localStorage` do navegador de cada pessoa. Use **Músicas → ⋯ Mais → Exportar tudo** para fazer backup.

## Publicar no GitHub

1. Crie um repositório novo em https://github.com/new (ex.: `montador-de-cifras`).
2. Envie os arquivos:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/montador-de-cifras.git
   git push -u origin main
   ```
   (Ou, pelo site do GitHub, use **Add file → Upload files** e arraste o `index.html` e o `README.md`.)

## Publicar na Vercel

1. Acesse https://vercel.com/new e entre com sua conta do GitHub.
2. Importe o repositório `montador-de-cifras`.
3. Em **Framework Preset** deixe **Other**. Não precisa de Build Command nem Output Directory.
4. Clique em **Deploy**. Em poucos segundos você recebe um link `https://….vercel.app`.

A cada `git push`, a Vercel publica a nova versão automaticamente.

## Alternativa: GitHub Pages

No repositório: **Settings → Pages → Branch: main / (root) → Save**. O site fica em `https://SEU-USUARIO.github.io/montador-de-cifras/`.

## Observações

- Cada pessoa vê apenas as cifras do próprio navegador/aparelho.
- Para imprimir sem data e endereço no papel, desmarque **Cabeçalhos e rodapés** na janela de impressão.
