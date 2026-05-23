# CBMMG — Missão Aprovação

PWA de cronograma de estudos para o concurso **CBMMG 2026**.
Inclui: dashboard com XP/patentes militares, calendário com revisões espaçadas (3/10/21/40 dias), edital interativo, checklist de tópicos, modo Foco com timer/Pomodoro, módulo de Questões com gráficos, planejador automático (linear ou cíclico) e reprogramação de atrasos.

## Como rodar localmente

Basta abrir `index.html` em um navegador moderno (Chrome, Edge, Safari, Firefox).
Para o service worker funcionar (PWA instalável), sirva via servidor — opções rápidas:

```bash
# Python 3
python3 -m http.server 8080

# Node
npx serve .
```

Depois acesse `http://localhost:8080`.

## Como publicar no GitHub Pages (gratuito)

1. **Criar o repositório:**
   - Vá em https://github.com/new
   - Nome do repo (ex: `cbmmg-cronograma`)
   - Marque como **Public** (Pages só funciona em repo público no plano grátis)
   - Crie sem README (já temos um)

2. **Subir os arquivos:**
   ```bash
   cd cbmmg-cronograma
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/cbmmg-cronograma.git
   git push -u origin main
   ```

   Ou pelo site: clique em **Add file → Upload files**, arraste tudo, e dê commit.

3. **Ativar o Pages:**
   - No repo, vá em **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** · folder **/ (root)**
   - **Save**

4. **Acessar:** depois de ~1 minuto, o app fica em
   `https://SEU-USUARIO.github.io/cbmmg-cronograma/`

5. **Instalar como PWA:**
   - **Android (Chrome):** abre o link → menu ⋮ → *Adicionar à tela inicial*
   - **iPhone (Safari):** abre o link → botão compartilhar → *Adicionar à Tela de Início*
   - **PC (Chrome/Edge):** ícone de instalação na barra de endereços

## Estrutura

```
cbmmg-cronograma/
├── index.html              Estrutura HTML (8 abas)
├── manifest.json           Manifest do PWA
├── sw.js                   Service Worker (cache v3 offline-first)
├── icons/                  Ícones do PWA (192 e 512)
├── css/style.css           Todos os estilos
└── js/
    ├── data.js             Constantes: MATS, TOPICS, RANKS, XP, datas
    ├── state.js            Estado global, helpers de data, persistência
    ├── modals.js           Modais (confirmar tópico/revisão, anotações)
    ├── reschedule.js       Reprogramação automática de atrasos
    ├── ui-dash.js          Dashboard (Missão)
    ├── ui-cal.js           Calendário
    ├── ui-edital.js        Visão por matéria
    ├── ui-topics.js        Lista de tópicos com busca/filtros
    ├── ui-foco.js          Modo Foco (timer + Pomodoro)
    ├── ui-planner.js       Eventos manuais + Planejador
    ├── ui-questoes.js      Módulo de Questões (form, charts, histórico)
    ├── ui-config.js        Configurações (data prova, backup, etc.)
    └── app.js              Boot, navegação, registro do SW
```

## Funcionalidades principais

- **Cronograma de estudos** com sistema de revisões espaçadas (3, 10, 21, 40 dias)
- **Sistema de XP e patentes militares** (Soldado → Capitão)
- **Reprogramação automática** de atrasos (3 modos: empurrar tudo, compactar, só remarcar)
- **Modo Foco** com cronômetro real e Pomodoro (25/5 ou 50/10)
- **Módulo de Questões** com 3 gráficos (volume, assertividade, evolução)
- **Cruzamento de dados:** % de acerto por tópico aparece no edital e em pontos fracos
- **Anotações por tópico**, **busca + filtros**, **calendário interativo**
- **Heatmap dos últimos 91 dias** no Dashboard
- **Backup completo** (export/import JSON)
- **Notificações locais** de revisões pendentes
- **Funciona offline** após primeira visita (PWA)

## Dados

Tudo persistido em `localStorage` (chave `cbmmg_cron2`). O app detecta automaticamente dados antigos da chave `cbmmg_q2` (módulo de questões standalone) e importa na primeira execução.

Para fazer backup: aba **Config → Exportar JSON**. Para restaurar: **Importar JSON**.

## Licença

Uso pessoal. Sinta-se livre para forkar e adaptar pro seu próprio cronograma.
