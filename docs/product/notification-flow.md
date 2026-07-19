# Fluxo de notificacoes de dose

## Objetivo

Avisar o usuario antes de uma dose e solicitar uma acao no horario agendado, mesmo quando o app estiver em segundo plano ou encerrado.

## Decisoes confirmadas

1. Cinco minutos antes do horario, o app entrega um pre-aviso nao bloqueante.
2. No horario da dose, o app entrega um alarme com as acoes `Marcar como tomado` e `Adiar 5 min`.
3. O alarme em tela cheia e opcional e depende de consentimento explicito e da permissao especial do Android.
4. Sem acesso a tela cheia, o app usa uma notificacao de alta prioridade com as mesmas acoes.
5. Som e vibracao se repetem por no maximo 60 segundos.
6. Sem interacao apos 60 segundos, o som e a vibracao param, a experiencia em tela cheia e encerrada e uma notificacao acionavel permanece visivel.
7. A ausencia de interacao nao registra a dose como tomada, pulada ou perdida; ela continua pendente.
8. Se o usuario ignorar o alarme, o app entrega um unico reforco dez minutos depois como notificacao de alta prioridade, sem abrir a tela cheia novamente.
9. Se o usuario escolher `Adiar 5 min`, o app agenda um novo alarme completo para cinco minutos depois.
10. O pre-aviso usa um unico som curto e suave, sem vibracao continua e sem tela cheia.
11. O pre-aviso identifica o medicamento, a dosagem quando informada e o horario agendado.
12. O pre-aviso nao oferece acoes rapidas; um toque abre a Home e destaca as doses daquele horario.
13. Doses do mesmo minuto geram um unico pre-aviso, como `2 medicamentos em 5 minutos`.
14. Ocorrencias agendadas para o mesmo minuto sao apresentadas em uma unica janela de doses.
15. Cada dose da janela possui suas proprias acoes `Marcar como tomado` e `Adiar 5 min`.
16. A interface nao oferece uma acao `Marcar todas como tomadas`.
17. Ao marcar uma dose como tomada antes do horario, o app cancela o pre-aviso, o alarme e o reforco daquela ocorrencia.
18. Se o pre-aviso ja tiver sido entregue, registrar a tomada antes do horario ainda cancela o alarme e o reforco futuros.
19. A preferencia `Mostrar detalhes na tela bloqueada` fica desativada por padrao.
20. Sem essa preferencia, a tela bloqueada mostra apenas `Hora do medicamento` e permite `Adiar 5 min`; identificar a dose e registra-la como tomada exige desbloquear o aparelho.
21. Com a preferencia ativada, nome, dosagem e as duas acoes ficam disponiveis na tela bloqueada.
22. Se o acesso a alarmes exatos estiver indisponivel, o app continua com notificacoes aproximadas e avisa que os lembretes podem atrasar.
23. A falta de acesso a alarmes exatos nao bloqueia cadastro, historico nem registro manual de doses.
24. `Tocar no silencioso e Nao Perturbe` e opcional e depende de preferencia explicita e acesso concedido pelo Android.
25. Sem esse acesso, o MedMinder usa o canal normal e explica que o Android pode silenciar o alarme.
26. O MedMinder nao altera globalmente o modo Nao Perturbe; o usuario continua no controle final dos canais.

## Requisitos de configuracao

Cada permissao ou acesso especial deve ser apresentado com linguagem orientada ao beneficio, sem expor nomes tecnicos do Android como titulo principal. O estado deve informar claramente o que funciona, o que fica limitado e qual acao o usuario pode realizar.

- `Receber lembretes`: permite que o MedMinder mostre notificacoes.
- `Tocar no silencioso e Nao Perturbe`: autoriza um canal critico opcional para alarmes de dose.
- `Avisar no horario exato`: reduz o risco de atraso causado pelo sistema.
- `Abrir alarme em tela cheia`: mostra a experiencia de alarme quando o Android permitir.
- `Mostrar detalhes na tela bloqueada`: controla a exposicao de nome e dosagem.

Cada item deve ter estado legivel, explicacao curta e um unico botao contextual, como `Ativar`, `Abrir configuracoes` ou `Testar`.

## Tela de alarme

A experiencia em tela cheia usa a `DoseAlarmActivity`, exclusiva para alarmes, que hospeda o componente React Native `MedMinderDoseAlarm`. Somente essa Activity pode aparecer sobre a lockscreen, acender a tela, mantê-la ativa e ocultar as barras do sistema. A `MainActivity` comum nunca usa essas flags. O `MedicationAlarmService` inicia o som nativo sem depender da renderizacao React.

A tela segue o design system Home Care Cards e a referencia visual em `docs/design/dose-alarm-screen.png`: fundo creme, verde profundo, acento pessego, bordas sutis, raio maximo de 8 px, icones lineares e acoes individuais por dose.

Quando houver notas do medicamento, a tela mostra no maximo duas linhas por dose. Notas seguem a preferencia `Mostrar detalhes na tela bloqueada` e ficam ocultas quando essa preferencia estiver desativada.

Quando o MedMinder estiver em primeiro plano, a mesma experiencia aparece como modal sobre a tela atual. O modal nao desmonta a navegacao nem perde dados de formularios; ao encerrar, o usuario retorna ao estado anterior.

A tela nao possui acao `Fechar`. Voltar, bloquear o aparelho ou trocar de app apenas minimiza a experiencia e nao altera a dose. O som continua ate o limite de 60 segundos e a notificacao permanece visivel.

Os botoes de volume ajustam apenas o volume; eles nao registram, pulam nem adiam uma dose.

## Momento da configuracao

Depois que o primeiro medicamento for salvo, o app apresenta o guia `Prepare seus lembretes` nesta ordem:

1. `Receber lembretes`.
2. `Tocar no silencioso e Nao Perturbe`, como opcao recomendada e nao obrigatoria.
3. `Avisar no horario exato`.
4. `Alarme em tela cheia`, como opcao recomendada e nao obrigatoria.

Os mesmos controles permanecem disponiveis em `Perfil > Lembretes`. O app nao solicita essas permissoes sem contexto na primeira abertura.

## Som e controle do sistema

O alarme no horario usa um `MediaPlayer` nativo com `AudioAttributes.USAGE_ALARM` dentro de um foreground service de duracao limitada. Quando esse player e agendado, a notificacao usa um canal silencioso de alta importancia para evitar audio duplicado. Sem acesso a alarmes exatos, o app volta ao canal sonoro como fallback. O canal critico continua opcional e so e criado quando o Android concede acesso a politica de notificacoes.

Em aparelhos Xiaomi, a opcao do sistema que permite midia no modo silencioso pode deixar o player nativo audivel mesmo quando sons de notificacoes seriam filtrados. Esse comportamento depende do fabricante e nao representa garantia de atravessar o modo Silencio total do Android.

A tela de configuracao explica o beneficio e a consequencia antes de abrir as configuracoes do Android. Se o usuario recusar ou revogar o acesso, alarmes futuros voltam ao canal normal. O app nao muda o modo Nao Perturbe do aparelho.

Som, vibracao, volume e excecoes ao modo Nao Perturbe permanecem sob controle final do usuario nas configuracoes do Android.

## Teste de alarme

`Testar alarme` agenda um evento isolado para cinco segundos depois, usando tela cheia, som e vibracao reais por no maximo dez segundos. A interface mostra `Teste de alarme` e apenas a acao `Encerrar teste`.

O teste nao cria ocorrencia, log, adesao, reforco nem adiamento. Ao terminar, a configuracao informa quais recursos funcionaram e quais permissoes ou acessos ainda faltam.

## Registro pelo alarme

Ao escolher `Marcar como tomado`, o app para o som, persiste a acao e encerra o alarme daquela dose sem pedir confirmacao adicional. Em uma janela com varias doses, as ocorrencias ainda nao resolvidas permanecem visiveis.

Depois do registro, uma notificacao discreta `Dose registrada como tomada` oferece `Desfazer` por dez minutos. A operacao deve ser idempotente para impedir logs duplicados caso o evento seja processado novamente.

## Limite de adiamentos

Cada ocorrencia permite no maximo tres adiamentos consecutivos de cinco minutos. Depois do terceiro, o app nao abre outra tela cheia e mantem uma notificacao pendente com `Marcar como tomado` e `Abrir MedMinder`.

Atingir o limite nao registra a dose automaticamente como tomada, pulada ou perdida.

## Encerramento do dia

Uma dose sem acao deixa de ficar pendente a meia-noite local e passa ao historico como `Nao registrada`. Esse estado reduz a adesao, mas nao afirma que o usuario deixou de tomar o medicamento.

O termo `Perdida` deve sair da interface e do vocabulario de dominio. A implementacao deve migrar ou interpretar dados antigos sem quebrar o historico.

## Fuso horario

Agendas por horario diario ou dias da semana seguem o horario local atual do aparelho. Ao detectar mudanca de fuso, o app cancela e recria pre-avisos, alarmes e reforcos futuros com base no novo horario local.

Agendas `A cada N horas` formam uma cadencia continua a partir da data e hora inicial, inclusive atraves da meia-noite. Mudancas de fuso preservam as horas reais entre ocorrencias e nao reiniciam a contagem.

## Constantes do MVP

O pre-aviso ocorre cinco minutos antes e cada adiamento dura cinco minutos. Esses valores nao sao configuraveis no MVP. Configuracoes antigas com outro valor devem ser migradas de forma explicita para cinco minutos.

`Pular dose` nao aparece no alarme nem na tela bloqueada. Essa acao permanece dentro do app e exige uma escolha deliberada na Home.

## Referencias de plataforma

- Android: https://developer.android.com/about/versions/14/behavior-changes-14
- Google Play: https://support.google.com/googleplay/android-developer/answer/13392821
- Notifee full-screen: https://notifee.app/react-native/docs/android/behaviour/
- Notifee actions: https://notifee.app/react-native/docs/android/interaction/
- Android NotificationChannel: https://developer.android.com/reference/android/app/NotificationChannel
