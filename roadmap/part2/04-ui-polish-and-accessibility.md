# 04 - UI Polish And Accessibility

## Goal

Bring the Android experience to MVP quality by fixing the remaining interaction, hierarchy, accessibility, and responsive-layout problems without departing from the approved "Home Care Cards" visual direction.

This stage includes five concrete product changes:

- make the time wheel cyclic without changing its appearance;
- keep the Add/Edit primary action in a stable position;
- replace the History placeholders with correct daily information;
- add a complete first-run onboarding with a required local-profile name;
- reorder reminder permissions by dependency and explain disabled states.

## Current Context

The app already has a cream, sage, forest-green, and peach design system, bottom tabs, custom headers, lucide icons, and reusable Care components. The direction is approved and must be preserved.

The implementation audit found these gaps:

- `WheelTimePicker` uses finite lists. It stops at `00` and `23` for hours and at `00` and `59` for minutes.
- Add and Edit render `Continuar`/`Salvar` as the last child of their `ScrollView`. The action moves vertically because accordion steps have different heights.
- History renders raw `YYYY-MM-DD` values and the placeholder `Resumo em breve`.
- Today's History adherence uses logs from all dates against today's expected-dose count, so the result can be incorrect.
- Settings and repositories use `Maria` as the default profile name. There is no first-run profile setup.
- The reminder setup guide only appears after a medication exists, instead of during first use.
- Profile places exact alarms and full-screen access before the basic notification permission they depend on.
- Several accessibility requirements are stated too broadly in the old plan. Adjustable controls, expanded state, selected state, error announcements, keyboard behavior, and font scaling need explicit acceptance criteria.

## Design System Requirements

This stage is a guardrail, not a redesign.

- Reuse tokens from `src/theme/*`.
- Reuse components from `src/components/ui/*` and existing Care components.
- Preserve the approved onboarding mock direction.
- Preserve the cream background, forest-green headings, sage surfaces, peach accents, subtle borders, and low-shadow treatment.
- Keep card radii at 8px or less.
- Avoid gradients, decorative blobs, nested cards, glass effects, and heavy shadows.
- Use `lucide-react-native` icons.
- Keep all interface copy in Portuguese.
- Keep primary touch targets at least 44px high.
- Prefer wrapping and stable layout over shrinking important text.
- New states must remain understandable without relying only on color.
- Do not add an external UI kit for this work.

## Implementation Steps

### 1. Make The Time Wheel Cyclic

Update `WheelTimePicker` while preserving its current visual dimensions, typography, selection band, spacing, colon alignment, and public `HH:mm` value contract.

Required behavior:

- Hours contain valid values `00` through `23`.
- Scrolling forward after `23` selects `00`.
- Scrolling backward before `00` selects `23`.
- Minutes contain valid values `00` through `59`.
- Scrolling forward after `59` selects `00`.
- Scrolling backward before `00` selects `59`.
- The transition must appear continuous in both directions.
- Selecting a visible adjacent item by touch must still work.
- `onChange` must emit only a normalized `HH:mm` string.

Implementation guidance:

- Render repeated cycles and start in a middle cycle instead of building an actually unbounded array.
- Convert the visual index to a value index with modulo arithmetic.
- After a scroll settles near either buffer edge, recenter to the equivalent item in the middle cycle without animation.
- Avoid issuing duplicate changes from both drag-end and momentum-end handlers.
- Extract and unit-test pure helpers for wrapping, visual-index mapping, and recentering.
- Expose each wheel column as an adjustable accessibility control with current value plus increment/decrement actions. Increment and decrement must wrap at the same boundaries.

### 2. Stabilize Add/Edit Primary Actions

Use the same form-shell behavior in Add and Edit so the screens cannot drift visually.

Required layout:

- Move `Continuar`, `Salvar medicamento`, and `Salvar alterações` outside the form `ScrollView`.
- Render the action in a persistent bottom action bar that uses the screen background/surface and a subtle top divider.
- Reserve enough bottom padding in the scroll content so the final fields and Care tip are never covered.
- Respect the bottom safe-area inset.
- Use keyboard-aware layout so the action remains reachable and does not cover the focused field.
- Keep the button at the same vertical location when changing accordion steps.
- Disable the action while saving to prevent duplicate submissions.
- Scroll or focus the first invalid field when validation blocks progress.

Prefer extracting a shared visual form shell or shared medication form flow because Add and Edit currently duplicate the accordion structure. Do not move persistence or domain decisions into the presentation component.

### 3. Replace History Placeholders With Daily Summaries

History must show real dose information, not placeholder copy.

Create a pure daily-history view-model builder that receives medications, schedules, dose logs, and a local date. It must:

- generate expected dose occurrences for that date;
- select only logs belonging to those occurrences;
- use the latest action for each occurrence;
- count taken, skipped, snoozed/pending, and unrecorded occurrences;
- calculate adherence as taken divided by expected occurrences for that same date;
- never count skipped doses as adherence;
- return no percentage when no doses were scheduled.

History layout:

- Keep a compact summary for today, but calculate it only from today's occurrences and logs.
- Replace raw dates with `Hoje`, `Ontem`, and localized labels such as `seg., 11 jul.`.
- Render seven continuous local-calendar days, including days without scheduled doses.
- Show `Sem doses programadas` for a day without occurrences instead of `0%`.
- For scheduled days, show `X de Y tomadas`, a compact progress indicator, and textual counts for skipped or unrecorded doses when present.
- Keep recent actions, but show a readable local date and time rather than only slicing the ISO string.
- Do not wrap the entire timeline inside another decorative card. Use clean full-width rows or individual repeated items.
- Preserve medication names for existing logs according to the current local-data deletion policy.

Use local calendar boundaries consistently; do not derive date labels by slicing UTC timestamps.

### 4. Add The Approved First-Run Onboarding

Create a full-screen onboarding shown before the main tabs on a fresh installation. The app must not briefly render Home with a default name while settings are loading.

Approved sequence:

1. **Welcome**
   - Title: `Bem-vindo ao MedMinder`.
   - Introduce the app as a personal medication reminder.
   - State that data stays on the device.
   - Primary action: `Começar`.
2. **Local profile**
   - Ask `Como podemos chamar você?`.
   - Name is required, trimmed, and must not default to a sample value.
   - Explain that it is stored only on the device.
3. **Feature guide**
   - One compact screen with three unframed feature rows:
     - `Organize sua rotina`;
     - `Cuide das doses de hoje`;
     - `Acompanhe seu histórico`.
   - Primary action: `Configurar lembretes`.
4. **Basic notifications**
   - Explain the pre-alert and dose alarm benefit before opening the Android prompt.
   - Primary action: `Permitir notificações`.
   - Secondary action: `Agora não`.
5. **Exact alarms**
   - Only reached when basic notifications are enabled.
   - Explain why Android may delay alarms without this access.
6. **Full-screen alarm**
   - Only reached when basic notifications are enabled.
   - Explain that Android controls whether full screen is available.
   - Show a small dose-alarm preview consistent with the approved mock.

Skipping behavior:

- The name cannot be skipped.
- If the user chooses `Agora não` for basic notifications, show an in-app confirmation styled with the current design system.
- Confirmation title: `Continuar sem lembretes?`.
- Explain that the app cannot warn before or at dose time without permission and that it can be enabled later in Profile.
- Primary confirmation action: `Voltar e permitir`.
- Secondary confirmation action: `Continuar sem lembretes`.
- Confirming the skip finishes onboarding and leaves exact/full-screen setup pending in Profile.
- Exact-alarm and full-screen steps may be skipped directly without the stronger confirmation.
- Do not repeatedly reopen onboarding after completion.

Persistence:

- Change the default `userName` to an empty string.
- Add an explicit persisted onboarding-completed setting; do not infer completion from a sample name.
- This MVP only needs correct fresh-install behavior. Existing development databases do not require a compatibility migration and may be reset/reinstalled for testing.
- Keep reminder permission state separate from onboarding completion. Finishing onboarding without permissions must not pretend those permissions were granted.
- Profile remains the place to edit the name and complete deferred reminder setup.

### 5. Reorder And Clarify Profile Reminder Settings

Render settings in dependency order:

1. `Permitir notificações` / basic notification status.
2. `Avisar no horário exato`.
3. `Alarme em tela cheia`.
4. `Detalhes na tela bloqueada`.
5. `Funcionamento em segundo plano` / battery optimization.
6. `Testar alarme`.

Behavior:

- Basic notification permission is always the first reminder card.
- Advanced controls remain visible when basic notifications are off, but are disabled.
- Disabled controls show `Ative as notificações primeiro` and must not open Android settings.
- Distinguish an app preference from Android permission state in the copy.
- Refresh permission state whenever the app returns to the foreground.
- The test action is enabled only when its prerequisites are met.
- Keep permission setup available in Profile even though it is also offered during onboarding.
- Do not automatically reopen first-run onboarding merely because a permission was denied later.

### 6. Complete The Accessibility Pass

Apply these concrete requirements across Home, Medications, Add, Edit, Detail, History, Profile, and onboarding:

- Pressable actions expose a meaningful role, label, and state.
- Accordion headers expose `accessibilityState.expanded`.
- Schedule-kind and weekday controls expose selected state.
- Icon-only actions have labels and, when useful, hints.
- Destructive and dose-changing actions explain their consequence.
- Validation errors and permission-status changes use a polite live region or alert semantics.
- Text inputs have explicit accessibility labels rather than relying only on adjacent visual labels.
- The cyclic time wheel supports TalkBack increment/decrement and announces the selected value.
- Disabled reminder controls announce why they are unavailable.
- Modal/confirmation focus starts on its title and returns to the triggering control when dismissed where React Native permits.
- Main controls remain usable with larger Android font settings; avoid using `adjustsFontSizeToFit` as the only overflow strategy for important actions.
- Use safe-area insets consistently for onboarding and persistent bottom actions.

### 7. Verify Remaining Screen States

Review all main screens with the established design system and make state behavior explicit:

- loading;
- empty;
- database error with retry;
- no pending doses;
- permission denied or blocked;
- paused medication;
- saving/disabled action;
- large text and small screen.

Do not add new business rules in this pass beyond the approved daily-adherence correction, onboarding state, and permission dependency behavior.

## Acceptance Criteria

- The time wheel loops continuously from `23` to `00` and `59` to `00` in both directions without a visual redesign.
- Add and Edit keep their primary action in the same stable bottom position across all accordion steps.
- Keyboard and safe-area behavior never hide the focused field or primary action.
- History contains no `Resumo em breve` text or raw `YYYY-MM-DD` labels.
- Today's adherence uses only today's expected occurrences and latest actions.
- Skipped doses do not increase adherence.
- Days without scheduled doses display `Sem doses programadas` and no percentage.
- Fresh installs show the approved onboarding before the main tabs.
- No sample/default profile name is displayed or persisted.
- The user cannot finish the name step with a blank value.
- Deferring basic notifications requires confirmation and leaves advanced setup pending in Profile.
- Basic notification permission appears before every dependent reminder setting in Profile.
- Advanced settings are visible but disabled until basic notifications are active.
- No main screen visually diverges from "Home Care Cards".
- No native/custom duplicate headers remain.
- Main actions remain reachable on small Android screens and with larger font settings.
- Adjustable, expanded, selected, disabled, and error states are meaningful in TalkBack.
- No external UI kit or conflicting visual language is introduced.

## Test Plan

Automated checks:

- Add unit tests for cyclic hour/minute wrapping and recentering.
- Add unit tests for daily summaries across taken, skipped, snoozed, unrecorded, and no-dose days.
- Add unit tests proving logs from another date do not affect today's adherence.
- Add settings repository tests for empty default name and persisted onboarding completion.
- Add component tests for required name validation, basic-permission skip confirmation, conditional permission flow, and disabled advanced settings where practical.
- Run `npm.cmd run typecheck`.
- Run `npm.cmd test -- --runInBand`.

Manual Android QA:

- Fresh install opens Welcome instead of Home.
- Name cannot be blank and appears in Home after completion.
- Feature guide matches the approved six-screen mock direction.
- Granting basic notifications continues to exact and full-screen setup.
- Deferring basic notifications opens the confirmation and then finishes onboarding only after explicit confirmation.
- Deferred settings are understandable and recoverable in Profile.
- Wheel wraps forward and backward repeatedly for hours and minutes.
- Add/Edit CTA remains fixed across every step and while the keyboard is open.
- History shows today, yesterday, five earlier days, and meaningful no-dose states.
- TalkBack focus order is logical on onboarding, Add/Edit, History, and Profile.
- Test at a small Android viewport and at least one larger system-font setting.

## Notes

- The approved onboarding storyboard is a visual reference, not a new design system.
- Valid boundaries are `23 -> 00` for hours and `59 -> 00` for minutes; `24` and `60` are not selectable values.
- Onboarding completion, notification permission, exact-alarm access, and full-screen access are separate states.
- Reminder permission copy must describe benefits and current state without promising behavior Android may refuse.
- Play Store screenshots should be produced only after this stage passes visual and real-device QA.
