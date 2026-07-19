# Android Permission Matrix

## Goal

Documentar quais acessos o MedMinder realmente precisa, como cada um deve ser solicitado e qual comportamento permanece disponível quando o usuário recusa. O onboarding deve explicar o benefício antes de abrir qualquer diálogo ou tela do Android.

## Onboarding Permissions

| Recurso | Android | Tipo | Solicitação correta | Comportamento sem acesso |
| --- | --- | --- | --- | --- |
| Receber lembretes | `POST_NOTIFICATIONS` no Android 13+ | Runtime | Explicar no app e chamar `notifee.requestPermission()`. Após uma negativa anterior, abrir as configurações de notificações do aplicativo. | O app funciona sem lembretes e permite ativá-los depois no Perfil. |
| Detalhes na tela bloqueada | Preferência interna do MedMinder | Escolha de privacidade | Explicar no onboarding antes das permissões avançadas e salvar `showLockScreenDetails`. Não abrir tela do Android. | Mostrar apenas `Hora do medicamento`, sem nome, dosagem ou notas. |
| Tocar no silencioso e Não Perturbe | `ACCESS_NOTIFICATION_POLICY` | Acesso especial opcional | Consultar `isNotificationPolicyAccessGranted()`, abrir `ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS`, criar o canal crítico e confirmar `NotificationChannel.canBypassDnd()`. Se o canal não puder atravessar o DND, abrir suas configurações específicas. | Usar o canal normal. O Android pode silenciar o alarme. |
| Avisar no horário exato | `SCHEDULE_EXACT_ALARM` no Android 12+ | Acesso especial | Consultar `AlarmManager.canScheduleExactAlarms()` pelo Notifee e abrir `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` com o pacote do app. | Usar trigger aproximado e informar que o Android pode atrasar o lembrete. |
| Alarme em tela cheia | `USE_FULL_SCREEN_INTENT`; concessão especial no Android 14+ | Acesso especial | Consultar `NotificationManager.canUseFullScreenIntent()` e abrir `ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT` para o pacote. | Exibir heads-up de alta prioridade com as mesmas ações. |
| Funcionamento em segundo plano | Otimização de bateria do fabricante/Android | Configuração especial opcional | Exibir a etapa no onboarding e abrir a tela oficial de otimização de bateria. Não solicitar bypass direto automaticamente. | Alarmes exatos continuam disponíveis no Android padrão, mas aparelhos com restrições agressivas podem atrasá-los ou bloqueá-los. |

## Manifest-Only Permissions

Estes acessos não possuem prompt no onboarding:

- `RECEIVE_BOOT_COMPLETED`: permite reconstruir lembretes após reinicialização.
- `VIBRATE`: habilita a vibração configurada nos canais.
- `WAKE_LOCK`: permite que a infraestrutura de alarme conclua trabalho curto ao acordar o aparelho.
- `INTERNET` e `ACCESS_NETWORK_STATE`: usados pela infraestrutura React Native/Notifee; o MedMinder não envia os dados de medicamentos para um backend.
- `FOREGROUND_SERVICE` e `FOREGROUND_SERVICE_SYSTEM_EXEMPTED`: mantêm o áudio nativo do alarme ativo por no máximo 60 segundos quando `SCHEDULE_EXACT_ALARM` está concedida. Não são permissões runtime, mas o uso do serviço deve ser declarado no Google Play Console.

O app não solicita localização, contatos, câmera, microfone, fotos, arquivos ou telefone.

## Battery And Manufacturer Restrictions

Remover a otimização de bateria não é requisito técnico para criar alarmes exatos com `SET_EXACT_AND_ALLOW_WHILE_IDLE`, nem é uma permissão runtime. Ainda assim, o onboarding apresenta essa configuração porque alguns fabricantes impõem restrições adicionais quando a tela está bloqueada. A etapa é explicativa, pode ser ignorada e não bloqueia a conclusão do primeiro acesso.

O Perfil mantém `Funcionamento em segundo plano` como diagnóstico. O app abre a tela oficial de otimização de bateria e não solicita bypass direto automaticamente.

## Lifecycle Requirements

- Ao voltar de uma tela de acesso especial, reler o estado no `AppState` ativo antes de avançar.
- Ao conceder alarmes exatos, o receiver deve tratar `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` e reconciliar os lembretes.
- Ao revogar uma capacidade, a próxima abertura ou retomada do app deve reconciliar os alarmes futuros.
- Preferências internas de tela cheia e alarmes críticos não substituem o acesso do Android; ambos precisam estar ativos.
- `Detalhes na tela bloqueada` é uma escolha de privacidade, não uma permissão Android, mas deve ser apresentada no onboarding e permanecer editável no Perfil.
- O estado de alarme crítico só é considerado pronto quando o acesso à política está concedido e o canal confirma `canBypassDnd()`.
- Canais permanecem sob controle final do usuário. O Perfil deve continuar mostrando o diagnóstico quando notificações ou canais forem alterados nas configurações.

## References

- Android notification permission: https://developer.android.com/develop/ui/compose/notifications/notification-permission
- Android exact alarms: https://developer.android.com/develop/background-work/services/alarms
- Android 14 full-screen intents: https://developer.android.com/about/versions/14/behavior-changes-14
- Android notification policy access: https://developer.android.com/reference/android/app/NotificationManager
- Android special permissions: https://developer.android.com/training/permissions/requesting-special
- Notifee Android behavior: https://notifee.app/react-native/docs/android/behaviour/
