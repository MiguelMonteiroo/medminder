# 02 - Fluxo Confiável De Notificações E Alarmes

## Goal

Implementar o fluxo Android de lembretes definido em `docs/product/notification-flow.md`: pré-aviso cinco minutos antes, alarme no horário, experiência opcional em tela cheia, ações funcionais com o app aberto ou encerrado, adiamento de cinco minutos, reforço por ausência de resposta e recuperação após reinício ou mudança de fuso.

Esta etapa termina somente quando o comportamento estiver validado em build release e dispositivo Android real. O app continua 100% offline, sem backend e sem push remoto.

## Current Context

O projeto usa React Native 0.86, `@notifee/react-native` 9.1.8, SQLite via `@op-engineering/op-sqlite` e Android target SDK 36.

O estado atual possui estas limitações:

- `src/services/reminderScheduler.ts` cria apenas uma notificação por ocorrência, exatamente no horário.
- A notificação atual não possui `pressAction`, ações rápidas, categoria de alarme, tela cheia, som em loop ou handoff após 60 segundos.
- `notification_mappings` pressupõe um único registro por ocorrência; o novo fluxo precisa de pré-aviso, alarme, handoff, reforço, adiamentos e confirmação.
- `index.ts` não registra `notifee.onBackgroundEvent`, portanto ações não funcionam com o app encerrado.
- Não existe listener de `onForegroundEvent` nem modal de alarme dentro do app.
- O agendador cria 14 dias de ocorrências e depende de o app voltar a abrir para continuar abastecendo os lembretes.
- `AppDataProvider` usa adiamento padrão de 30 minutos, enquanto o repositório de settings usa 5 minutos.
- O tipo `missed` existe, mas nunca é produzido pelo dose engine.
- Agendas `intervalHours` reiniciam diariamente e não mantêm uma cadência contínua.
- O Manifest declara simultaneamente `USE_EXACT_ALARM` e `SCHEDULE_EXACT_ALARM`; `USE_EXACT_ALARM` é restrito pelo Google Play e deve ser removido.
- Não existe `USE_FULL_SCREEN_INTENT`, verificação de acesso a tela cheia nem fluxo explicativo para o usuário.
- `MainActivity` e `index.ts` ainda não suportam um componente React Native separado para o alarme.

Antes de implementar, ler obrigatoriamente:

- `docs/product/notification-flow.md`
- `CONTEXT.md`
- `docs/adr/0004-optional-full-screen-dose-alarms.md`
- `docs/adr/0005-react-native-dose-alarm-screen.md`
- `docs/design/dose-alarm-screen.png`

## Design System Requirements

Toda interface nova deve respeitar o design system atual Home Care Cards.

- Reutilizar tokens de `src/theme/*`.
- Reutilizar `src/components/ui/*` e componentes Care existentes quando forem adequados.
- Fundo creme, verde profundo/sálvia e acento pêssego.
- Cards com raio máximo de 8 px, bordas sutis e quase nenhuma sombra.
- Usar `lucide-react-native` para ícones.
- Manter UI em português e centralizar textos novos em `src/i18n/ptBR.ts`.
- Não adicionar UI kit externo.
- Não criar cards dentro de cards, gradientes decorativos ou telas técnicas desconectadas do restante do app.
- Garantir alvos de toque de pelo menos 44 px.
- Garantir labels e hints acessíveis em ações e controles.
- A tela de alarme deve seguir `docs/design/dose-alarm-screen.png`.
- Estados de permissão devem explicar benefício, consequência e próxima ação em linguagem simples.

## Confirmed Product Behavior

O comportamento abaixo está fechado e não deve ser reinterpretado durante a implementação:

1. Cinco minutos antes, entregar um pré-aviso leve, com um som curto, sem vibração contínua e sem tela cheia.
2. O pré-aviso não altera estado. Um toque abre a Home e destaca a janela de doses.
3. No horário, entregar um alarme com `Marcar como tomado` e `Adiar 5 min`.
4. `Pular dose` permanece somente dentro do app.
5. Tela cheia é opt-in. Sem acesso, usar notificação de alta prioridade com as mesmas ações.
6. Som e vibração do alarme duram no máximo 60 segundos.
7. Após 60 segundos sem ação, encerrar som/tela cheia e manter notificação acionável.
8. Após dez minutos sem ação, entregar um único reforço sem tela cheia.
9. `Adiar 5 min` cria um novo alarme completo cinco minutos depois.
10. Permitir no máximo três adiamentos consecutivos por ocorrência.
11. Depois do terceiro adiamento, manter apenas notificação pendente com `Marcar como tomado` e `Abrir MedMinder`.
12. Doses do mesmo minuto formam uma única janela visual, com ações independentes.
13. Nunca oferecer `Marcar todas como tomadas`.
14. Marcar antecipadamente cancela todos os artefatos futuros da ocorrência.
15. Registrar como tomada é imediato e idempotente.
16. Após registrar, oferecer `Desfazer` por dez minutos.
17. Uma dose sem ação vira `Não registrada` à meia-noite local.
18. Horários diários/semanais acompanham o fuso local.
19. Intervalos de N horas são contínuos e preservam horas reais durante mudança de fuso.
20. Detalhes na tela bloqueada são opt-in; sem isso, exigir desbloqueio para identificar e registrar a dose.
21. Notas aparecem em no máximo duas linhas e obedecem à preferência de privacidade.
22. Sair da tela, voltar, bloquear o aparelho ou trocar de app não resolve a dose.
23. `Tocar no silencioso e Não Perturbe` é opt-in; quando preferência e acesso do Android estão ativos, usar o canal crítico versionado. Recusa ou revogação volta ao canal normal sem bloquear o app.

## Target Architecture

Separar responsabilidades para que componentes React não façam acesso direto ao Notifee ou ao banco:

```text
Dose engine
  -> reminder planner
    -> reminder scheduler
      -> Notifee + reminder_artifacts

Notifee foreground/background event
  -> notification action handler
    -> dose command service
      -> dose_logs + cancel/reschedule artifacts

Android boot/time/timezone events
  -> reminder reconciliation
    -> rebuild future artifacts
```

Criar ou reorganizar estes módulos:

- `src/services/reminders/reminderPlanner.ts`: transforma ocorrências/janelas em artefatos com timestamps.
- `src/services/reminders/reminderScheduler.ts`: cria, atualiza e cancela triggers/displayed notifications.
- `src/services/reminders/reminderReconciler.ts`: compara banco, Notifee e domínio.
- `src/services/reminders/notificationBuilder.ts`: cria payloads Notifee por tipo.
- `src/services/reminders/notificationActionHandler.ts`: processa ações idempotentes.
- `src/services/reminders/notificationChannels.ts`: cria e inspeciona canais.
- `src/services/reminders/reminderPermissionService.ts`: estado agregado e links para settings.
- `src/services/reminders/alarmTestService.ts`: teste isolado.
- `src/database/openAppDatabase.ts`: bootstrap compartilhado por UI e Headless JS.
- `src/hooks/useNotificationEvents.ts`: eventos em primeiro plano e abertura da Home.
- `src/screens/DoseAlarmScreen.tsx`: componente separado de tela cheia.
- `src/components/reminders/ReminderSetupGuide.tsx`: guia após o primeiro medicamento.
- `src/components/reminders/ReminderReadinessCard.tsx`: cards claros em Perfil.

Manter fachadas temporárias nos caminhos antigos quando isso reduzir o tamanho do diff. Remover fachadas somente depois de migrar todos os consumidores e testes.

## Public Interfaces And Type Changes

Adicionar tipos explícitos em `src/types/domain.ts` ou em um arquivo focado de reminders:

```ts
type ReminderArtifactKind =
  | "preAlert"
  | "doseAlarm"
  | "alarmHandoff"
  | "reinforcement"
  | "snoozedAlarm"
  | "takenConfirmation"
  | "alarmTest";

type ReminderArtifact = {
  id: string;
  kind: ReminderArtifactKind;
  notificationId: string;
  doseOccurrenceId: string;
  medicationId: string;
  scheduleId: string;
  doseWindowKey: string;
  scheduledFor: string;
  expiresAt: string;
};

type ReminderPermissionState = {
  notifications: "granted" | "denied" | "blocked";
  exactAlarms: "granted" | "denied" | "notRequired";
  fullScreen: "granted" | "denied" | "unsupported";
  doNotDisturb: "granted" | "denied";
  batteryOptimization: "optimized" | "unrestricted" | "unknown";
};

type NotificationActionId =
  | "mark-taken"
  | "snooze-five"
  | "undo-taken"
  | "open-dose-window"
  | "end-alarm-test";
```

Atualizar `ReminderSettings`:

- Manter `notificationsEnabled` como preferência do app, separada da permissão do Android.
- Fixar `defaultSnoozeMinutes` em 5 durante a migração e parar de expor configuração no MVP.
- Adicionar `fullScreenAlarmEnabled: boolean`, default `false`.
- Adicionar `criticalAlertsEnabled: boolean`, default `false` e separado do acesso concedido pelo Android.
- Adicionar `showLockScreenDetails: boolean`, default `false`.
- Adicionar `reminderSetupCompleted: boolean`, default `false`.

Substituir `DoseStatus` de UI `missed` por `unrecorded`. Se for arriscado renomear internamente de uma vez, aceitar `missed` apenas como valor legado na leitura, mas nunca renderizá-lo como `Perdida`.

Expor serviços por intenção:

```ts
scheduleMedicationReminders(medicationId: string): Promise<void>
cancelOccurrenceReminders(occurrenceId: string): Promise<void>
cancelMedicationReminders(medicationId: string): Promise<void>
reconcileReminders(reason: ReconcileReason): Promise<ReconcileResult>
handleNotificationAction(command: NotificationActionCommand): Promise<void>
runAlarmTest(): Promise<AlarmTestResult>
getReminderReadiness(): Promise<ReminderReadiness>
```

## Implementation Steps

### 1. Lock The Baseline

1. Rodar `git status --short` e preservar mudanças não relacionadas.
2. Rodar `npm.cmd run typecheck` e `npm.cmd test -- --runInBand`.
3. Adicionar testes de caracterização para:
   - criação de ocorrência diária;
   - criação por dias da semana;
   - comportamento atual de intervalo;
   - status taken/skipped/snoozed/undone;
   - cancelamento por medicamento.
4. Não começar alterações Android antes de os testes de domínio estarem verdes.

### 2. Correct Dose Semantics First

1. Atualizar `doseEngine.ts` para agendas `intervalHours` contínuas a partir de um instante âncora.
2. Adicionar `anchorAt` a `MedicationSchedule`.
3. Ao criar uma agenda por intervalo, preencher `anchorAt` com data e hora inicial completas.
4. Horários diários e semanais continuam representados como horário local.
5. Adicionar uma função pura para resolver mudança de dia:
   - hoje sem ação: `pending` ou `snoozed`;
   - data anterior sem ação: `unrecorded`;
   - não inferir `unrecorded` antes da meia-noite local.
6. Preservar leitura de logs legados. Documentar qualquer mudança de identidade de ocorrência e criar teste de compatibilidade antes de mudar o formato do ID.
7. Atualizar summary, History, badges e copy para `Não registrada`.

Testes obrigatórios:

- intervalo de 8h: 08:00, 16:00, 00:00, 08:00;
- intervalo atravessando horário de verão/fuso mantém horas reais;
- horário diário 08:00 continua 08:00 local após mudança de fuso;
- pendência de ontem vira `unrecorded`;
- pendência de hoje não vira `unrecorded` prematuramente.

### 3. Add A Versioned Database Migration

Subir `DATABASE_VERSION` e executar a migração em transação.

Alterações mínimas:

1. `medication_schedules`:
   - adicionar `anchor_at TEXT NOT NULL DEFAULT ''`.
2. `dose_logs`:
   - adicionar `command_id TEXT NOT NULL DEFAULT ''`;
   - criar índice único parcial para `command_id` não vazio;
   - usar esse ID para idempotência de ações de notificação.
3. Substituir a limitação de `notification_mappings` por uma tabela `reminder_artifacts` capaz de armazenar múltiplos artefatos por ocorrência:
   - `id`;
   - `kind`;
   - `notification_id`;
   - `dose_occurrence_id`;
   - `medication_id`;
   - `schedule_id`;
   - `dose_window_key`;
   - `scheduled_for`;
   - `expires_at`;
   - `created_at`.
4. Criar índices por `dose_occurrence_id`, `medication_id`, `notification_id`, `scheduled_for` e `dose_window_key`.
5. Migrar ou invalidar mappings antigos de forma controlada e cancelar triggers antigos durante o primeiro bootstrap pós-migração.
6. Migrar `defaultSnoozeMinutes` para `5` e inserir os novos settings com defaults seguros.
7. Testar migração a partir de banco v1 populado e banco v1 vazio.

O repositório novo deve oferecer consultas em lote e cancelamento por ocorrência, medicamento, janela e tipo. `getByDoseOccurrenceId` deve retornar array, nunca apenas o primeiro registro.

### 4. Make Database Bootstrap Available Outside React

1. Extrair abertura e migration para `openAppDatabase.ts` com singleton por processo.
2. Fazer `DatabaseProvider` consumir esse bootstrap.
3. Permitir que o handler do Notifee abra o mesmo banco em Headless JS sem depender de hooks ou context.
4. Construir repositories e serviços por factory, sem importar `AppDataProvider` no handler.
5. Garantir que duas chamadas simultâneas de bootstrap compartilhem a mesma Promise.
6. Tratar falha de abertura sem descartar silenciosamente a ação; manter log diagnóstico e deixar a notificação acionável.

### 5. Create Separate Versioned Android Channels

Criar canais antes de qualquer scheduling:

1. `medication-pre-alerts-v1`:
   - importância default;
   - som curto próprio;
   - sem vibração contínua;
   - categoria reminder.
2. `medication-dose-alarms-v2`:
   - importância high;
   - som próprio com `AudioAttributes.USAGE_ALARM`;
   - padrão de vibração com quantidade par de valores positivos;
   - categoria alarm;
   - usado pelo alarme normal de 60 segundos e pelo reforço.
3. `medication-dose-alarms-critical-v2`:
   - criado nativamente apenas após acesso à política de notificações;
   - mesmas características do canal normal;
   - `setBypassDnd(true)`;
   - usado somente quando `criticalAlertsEnabled` e acesso do Android estão ativos.
4. `medication-dose-status-v1`:
   - importância low/default;
   - sem som;
   - confirma tomada e oferece desfazer.
5. `medication-pending-v1`:
   - sem som em loop;
   - usado após o handoff de 60 segundos.

Adicionar sons originais/licenciados em `android/app/src/main/res/raw/`, com nomes Android válidos. Registrar origem/licença em `docs/legal/audio-assets.md`. Não usar áudio de terceiros sem licença compatível.

Como propriedades de canais ficam sob controle do usuário e não podem ser reconfiguradas livremente após criação, qualquer alteração incompatível exige novo sufixo de versão.

### 6. Implement Clear Permission And Readiness State

Atualizar o serviço de permissão para distinguir:

1. `Receber lembretes`:
   - `POST_NOTIFICATIONS` / authorization do Notifee.
2. `Avisar no horário exato`:
   - `settings.android.alarm` do Notifee;
   - abrir `notifee.openAlarmPermissionSettings()` quando negado.
3. `Abrir alarme em tela cheia`:
   - preferência interna opt-in;
   - em API 34+, consultar `NotificationManager.canUseFullScreenIntent()` por um pequeno módulo nativo;
   - abrir `ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT` quando necessário.
4. `Tocar no silencioso e Não Perturbe`:
   - preferência interna separada do acesso do Android;
   - consultar `NotificationManager.isNotificationPolicyAccessGranted`;
   - abrir `ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS`;
   - reconciliar alarmes futuros após concessão ou revogação.
5. Economia de bateria:
   - inspecionar com APIs do Notifee;
   - não pedir bypass automaticamente;
   - mostrar orientação somente quando a otimização realmente limitar confiabilidade.

Cada estado deve ter:

- título orientado ao benefício;
- frase curta explicando a limitação;
- badge textual;
- um único CTA contextual;
- `Testar alarme` quando o setup mínimo estiver disponível.

Se alarme exato estiver negado, usar trigger aproximado suportado e mostrar `Os lembretes podem atrasar`. Não bloquear o app.

### 7. Fix Android Manifest And Native Integration

Atualizar `AndroidManifest.xml`:

1. Manter `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE` e `SCHEDULE_EXACT_ALARM`.
2. Remover `USE_EXACT_ALARM` para evitar a permissão restrita do Google Play.
3. Adicionar `USE_FULL_SCREEN_INTENT`.
4. Adicionar `ACCESS_NOTIFICATION_POLICY` para o canal crítico opt-in, sem alterar globalmente o modo Não Perturbe.
5. Declarar `DoseAlarmActivity` separada, fora dos recentes e com acesso à lockscreen somente durante alarmes.
6. Remover `showWhenLocked` e `turnScreenOn` da `MainActivity`.
7. Declarar somente receivers/services realmente exigidos pela implementação e marcar `exported` corretamente.

Manter `MainActivity` como experiência comum e direcionar `pressAction`/`fullScreenAction` para `DoseAlarmActivity`, que hospeda `MedMinderDoseAlarm`, controla `STREAM_ALARM` e encerra após ação ou timeout.

Adicionar um módulo Kotlin estreito para:

- consultar acesso a full-screen intent em API 34+;
- abrir a tela especial correspondente;
- retornar `unsupported` em versões anteriores quando apropriado.

Não mover lógica de dose ou banco para Kotlin.

### 8. Build Notification Payloads As Pure Functions

`notificationBuilder.ts` deve receber view-models e retornar objetos Notifee sem acesso ao banco.

Criar builders separados:

- `buildPreAlertNotification`;
- `buildDoseAlarmNotification`;
- `buildPendingHandoffNotification`;
- `buildReinforcementNotification`;
- `buildTakenConfirmationNotification`;
- `buildAlarmTestNotification`.

Todos os payloads de dose devem carregar:

- versão do payload;
- `doseOccurrenceId`;
- `medicationId`;
- `scheduleId`;
- `doseWindowKey`;
- tipo do artefato;
- timestamp esperado.

Privacidade:

- Com detalhes bloqueados, título/body genéricos na lockscreen e ação de tomada exige abrir/desbloquear o app.
- Com detalhes permitidos, incluir nome, dosagem e notas truncadas.
- Nunca incluir notas completas sem limite.

### 9. Plan And Schedule The Reminder Timeline

Para uma ocorrência em `T`:

```text
T - 5 min  preAlert
T          doseAlarm (full screen only when allowed)
T + 60 s   alarmHandoff -> persistent actionable notification
T + 10 min reinforcement (only if still unresolved)
```

Regras:

1. Não agendar artefatos cujo horário já passou.
2. Se o pré-aviso já passou, ainda agendar o alarme e os estados posteriores.
3. Se a ocorrência for resolvida, cancelar todos os seus artifacts.
4. Agrupar ocorrências no mesmo minuto usando `doseWindowKey` estável.
5. O alarme visual da janela recebe todas as doses; ações continuam individuais.
6. `timeoutAfter` pode encerrar a notificação sonora, mas o handoff persistente deve existir independentemente da tela React.
7. O reforço deve ser cancelado ao tomar, pular ou adiar.
8. Ao adiar, cancelar artifacts remanescentes e criar novo alarme em `agora + 5 min`; não criar novo pré-aviso.
9. O reforço de uma dose adiada conta a partir do novo alarme.
10. Após três adiamentos, não criar novo full-screen artifact.

Evitar agendar 14 dias multiplicados por quatro artifacts. Implementar uma janela curta de segurança e reposição contínua:

- manter artifacts suficientes para pelo menos 48 horas;
- reconciliar no startup, após CRUD, após ação, após entrega e periodicamente;
- agendar apenas artifacts ausentes por chave determinística;
- respeitar limites de triggers de fabricantes.

### 10. Register Background And Foreground Event Handling

Em `index.ts`, antes de `AppRegistry.registerComponent`:

1. Registrar um único `notifee.onBackgroundEvent`.
2. Delegar para `notificationActionHandler`.
3. Retornar/resolver a Promise somente depois de persistir e atualizar/cancelar a notificação.

Tratar:

- `ACTION_PRESS / mark-taken`;
- `ACTION_PRESS / snooze-five`;
- `ACTION_PRESS / undo-taken`;
- `ACTION_PRESS / open-dose-window`;
- `ACTION_PRESS / end-alarm-test`;
- `DELIVERED` para reposição/reconciliação necessária;
- `DISMISSED` apenas como telemetria local opcional, nunca como ação de dose.

No app React:

- assinar `onForegroundEvent` uma vez;
- abrir modal `DoseAlarmScreen` quando o alarme for entregue em primeiro plano;
- navegar para Home/dose window quando um pré-aviso for pressionado;
- consumir `getInitialNotification()` no cold start;
- impedir listeners duplicados em Fast Refresh.

### 11. Make Notification Actions Atomic And Idempotent

`mark-taken`:

1. Abrir banco/repositories.
2. Validar payload/version.
3. Persistir log taken com `command_id` determinístico.
4. Cancelar artifacts da ocorrência.
5. Exibir confirmação silenciosa com `Desfazer` e expiração em dez minutos.
6. Reconciliar próxima janela.

`undo-taken`:

1. Persistir undo idempotente.
2. Cancelar confirmação.
3. Restaurar estado pendente.
4. Mostrar notificação pendente acionável, sem reabrir automaticamente um novo alarme em tela cheia.

`snooze-five`:

1. Contar snoozes da ocorrência.
2. Se menor que três, persistir snooze, cancelar artifacts e criar novo alarme em cinco minutos.
3. Se igual a três, manter notificação pendente e abrir o app quando solicitado.
4. Nunca duplicar logs ou alarms em retry do mesmo evento.

Se duas ações concorrentes ocorrerem, a ação persistida primeiro encerra a ocorrência; a segunda deve virar no-op seguro, exceto undo explícito.

### 12. Implement DoseAlarmScreen

Registrar em `index.ts`:

```ts
AppRegistry.registerComponent("MedMinder", () => App);
AppRegistry.registerComponent("MedMinderDoseAlarm", () => DoseAlarmRoot);
```

Implementar `DoseAlarmRoot` com bootstrap mínimo:

- não montar navegação completa;
- abrir banco apenas quando uma ação exigir persistência direta;
- ler payload inicial do Notifee;
- renderizar loading curto e estado de erro recuperável;
- nunca mostrar tela vermelha por falha do banco.

UI:

- seguir o mock aprovado;
- exibir horário e quantidade de doses;
- cards/rows individuais;
- `Marcar como tomado` e `Adiar 5 min` por dose;
- até duas linhas de notas;
- remover uma linha após ação;
- fechar quando todas forem resolvidas ou após 60 segundos;
- sem botão `Fechar` e sem `Pular`;
- anunciar via acessibilidade quando uma dose for resolvida.

No fluxo foreground, reutilizar o mesmo componente visual como modal e preservar a tela subjacente.

### 13. Implement Permission Onboarding And Profile UI

Após salvar o primeiro medicamento, se `reminderSetupCompleted` for falso, apresentar `Prepare seus lembretes`:

1. `Receber lembretes`.
2. `Tocar no silencioso e Não Perturbe` como recomendado e opcional.
3. `Avisar no horário exato`.
4. `Alarme em tela cheia` como recomendado e opcional.

Permitir sair do guia sem bloquear o cadastro. Salvar progresso e não reapresentar agressivamente.

Em `Perfil > Lembretes`, substituir o toggle único por estados independentes:

- `Receber lembretes`;
- `Tocar no silencioso e Não Perturbe`;
- `Avisar no horário exato`;
- `Abrir alarme em tela cheia`;
- `Mostrar detalhes na tela bloqueada`;
- diagnóstico de bateria quando necessário;
- `Testar alarme`.

Não desligar automaticamente a preferência interna apenas porque uma permissão foi negada; isso impede distinguir intenção do usuário de estado temporário do sistema.

### 14. Implement The Isolated Alarm Test

`Testar alarme`:

1. Validar readiness.
2. Agendar teste para cinco segundos depois.
3. Usar som, vibração e tela cheia reais.
4. Encerrar automaticamente em dez segundos.
5. Mostrar apenas `Teste de alarme` e `Encerrar teste`.
6. Não tocar em medications, schedules, dose logs, adherence ou reminder artifacts de produção.
7. Retornar resultado compreensível:
   - notificação exibida;
   - horário exato disponível;
   - tela cheia aberta ou fallback usado;
   - canal silenciado/bloqueado quando detectável.

### 15. Reconcile On Lifecycle And Device Events

Reconciliation deve ser idempotente e aceitar um `reason`:

- `app-start`;
- `medication-created`;
- `medication-edited`;
- `medication-paused`;
- `medication-resumed`;
- `medication-deleted`;
- `dose-action`;
- `notification-delivered`;
- `boot-completed`;
- `time-changed`;
- `timezone-changed`;
- `permission-changed`.

No Android, garantir reposição após boot e mudanças de relógio/fuso. Preferir integração mínima via receiver/worker que inicia a rotina Headless JS; não duplicar regras de recurrence em Kotlin.

Adicionar reposição periódica com WorkManager em intervalo conservador, mantendo buffer de 48 horas. A rotina deve sair rapidamente quando notificações estiverem desativadas ou não houver agenda ativa.

Documentar a limitação inevitável: se o usuário aplicar `Forçar parada`, o Android pode impedir alarms/jobs até o app ser aberto novamente.

### 16. Integrate Medication Mutations

Atualizar intent-level methods:

- criar medicamento: persistir, gerar próximas ocorrências e schedule artifacts;
- editar: cancelar artifacts antigos antes de salvar/agendar novos;
- pausar: cancelar todos os artifacts futuros;
- reativar: recalcular a partir de agora;
- remover: cancelar displayed/trigger notifications antes do cascade no banco;
- tomar/pular manualmente: cancelar artifacts da ocorrência;
- desfazer manualmente: restaurar estado sem duplicar alarmes passados;
- marcar antecipadamente: cancelar pré-aviso/alarme/handoff/reforço.

Não usar arrays de state React como fonte de verdade dentro de handlers em background. Sempre consultar repositories.

### 17. Prepare Google Play Compliance

1. Documentar por que alarmes são funcionalidade central do MedMinder.
2. Preencher a declaração de `USE_FULL_SCREEN_INTENT` no Play Console.
3. Explicar no app que tela cheia é opcional e controlada pelo usuário.
4. Não alegar confiabilidade médica garantida.
5. Não declarar `USE_EXACT_ALARM`.
6. Manter política de privacidade consistente: dados e ações permanecem locais.
7. Se a declaração de full-screen não for aprovada, manter fallback completo e remover qualquer copy que prometa tela cheia garantida.

Referências oficiais:

- Android full-screen intents: https://developer.android.com/about/versions/14/behavior-changes-14
- Android exact alarms: https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
- Google Play full-screen requirements: https://support.google.com/googleplay/android-developer/answer/13392821
- Notifee interactions: https://notifee.app/react-native/docs/android/interaction/
- Notifee events: https://notifee.app/react-native/docs/events/
- Notifee full-screen behavior: https://notifee.app/react-native/docs/android/behaviour/

## Acceptance Criteria

- Pré-aviso chega cinco minutos antes com comportamento leve.
- Alarme chega no horário em dispositivo real quando alarmes exatos estão permitidos.
- Fallback funciona e é explicado quando alarmes exatos ou full-screen estão negados.
- Tela cheia respeita opt-in e a configuração da lockscreen.
- Alarmes críticos respeitam opt-in; recusa/revogação usa canal normal e não bloqueia o app.
- App foreground mostra modal sem perder formulário/navegação.
- `Marcar como tomado` funciona com app aberto, em background e encerrado.
- `Adiar 5 min` funciona com app aberto, em background e encerrado.
- Três snoozes são permitidos; o quarto não cria novo alarme.
- `Desfazer` funciona durante dez minutos e não duplica logs.
- Som/tela cheia encerram após 60 segundos e deixam notificação pendente.
- Um único reforço ocorre dez minutos depois quando não há ação.
- Doses simultâneas aparecem juntas e continuam independentes.
- Tomar antecipadamente cancela todos os artifacts.
- Pausar, editar e remover cancelam alarms antigos.
- Reinício do app e do dispositivo preserva/recria alarms.
- Mudança de fuso reage corretamente.
- Intervalos de N horas são contínuos.
- Pendências antigas aparecem como `Não registrada`.
- Teste de alarme não altera dados de produção.
- Mappings não acumulam registros órfãos.
- Nenhuma tela nova quebra o Home Care Cards.
- Build release passa no teste real-device.

## Test Plan

### Automated Tests

Adicionar testes unitários para:

- timeline T-5/T/T+60s/T+10m;
- ausência de artifacts no passado;
- cancelamento por ocorrência/medicamento/window;
- grouping por minuto;
- builders com/sem detalhes de lockscreen;
- limite de três snoozes;
- idempotência de taken/snooze/undo;
- concorrência de duas ações;
- transição para unrecorded à meia-noite;
- daily/weekday após mudança de fuso;
- intervalo contínuo;
- migração v1 para a nova versão;
- reconciliation sem duplicatas;
- permission/readiness mapping;
- alarm test sem escrita em tabelas de domínio.

Adicionar testes de componente para:

- `DoseAlarmScreen` com uma e várias doses;
- remoção de row após ação;
- privacidade ligada/desligada;
- setup guide;
- cards de permissão;
- estados denied/granted/fallback;
- fonte Android maior e textos longos.

Comandos:

```powershell
npm.cmd run typecheck
npm.cmd test -- --runInBand
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
```

### Manual Emulator QA

- API 33: permission de notificações negada/concedida.
- API 34+: exact alarm negado/concedido.
- API 34+: full-screen negado/concedido.
- App foreground, background e removido dos recentes.
- Tela bloqueada com detalhes ocultos e visíveis.
- Uma dose e duas doses no mesmo minuto.
- Tomar, desfazer, adiar três vezes e atingir limite.
- Ignorar por 60 segundos e receber handoff.
- Ignorar por dez minutos e receber um reforço.
- Reiniciar emulador antes do alarme.
- Alterar hora e fuso do emulador.

O emulador não valida vibração física nem comportamento de fabricantes.

### Real Device Release QA

Executar em pelo menos um Android 14+ real:

- instalar APK/AAB release limpo;
- completar setup depois do primeiro medicamento;
- executar `Testar alarme`;
- validar volume e Não Perturbe;
- validar lockscreen;
- reiniciar aparelho;
- deixar app sem abrir e confirmar reposição;
- testar economia de bateria padrão;
- testar pause/edit/delete antes do trigger;
- verificar histórico e adesão após ações de notificação.

Para diagnóstico, registrar IDs/tipos/timestamps em logs de desenvolvimento sem incluir nome, dosagem ou notas.

## Rollout Sequence

Dividir a implementação em commits verificáveis:

1. Dose semantics e testes.
2. Migration e repositories de artifacts.
3. Bootstrap de banco fora do React.
4. Channels, builders e permission state.
5. Planner/scheduler/reconciler.
6. Background actions idempotentes.
7. DoseAlarmScreen e foreground modal.
8. Setup/Profile/Testar alarme.
9. Boot/timezone/periodic reconciliation.
10. Release QA e documentação Play.

Não misturar todos os passos em um único commit.

## Notes

- Notificações são locais; não adicionar Firebase, backend ou conta.
- Full-screen intent não é garantido pelo Android, mesmo com a preferência ativa.
- O usuário mantém controle final de canais, som, vibração e Não Perturbe.
- `Forçar parada` é uma limitação do sistema e deve ser documentada, não contornada.
- Triggers em excesso podem atingir limites de fabricantes; usar artifacts determinísticos, buffer curto e reconciliação.
- Não registrar dados de saúde em logs de diagnóstico.
- Não prometer que o MedMinder substitui orientação médica ou equipamento clínico.
