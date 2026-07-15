# MedMinder

MedMinder is a personal medication reminder app that helps a person act on scheduled doses and keep a local history of those actions.

## Language

**Dose occurrence**:
A medication dose expected at a specific date and time.
_Avoid_: Reminder, alarm

**Interval schedule**:
A continuous sequence of dose occurrences separated by a fixed number of elapsed hours from one starting instant, including across midnight and time-zone changes.
_Avoid_: Daily interval, repeated daily time

**Pre-alert**:
A non-blocking notification delivered five minutes before a dose occurrence.
_Avoid_: Early alarm, first notification

**Local notification**:
An alert scheduled and delivered entirely by the user's device without a backend or remote message service.
_Avoid_: Push notification, server notification

**Dose alarm**:
The urgent alert delivered at the scheduled time of a dose occurrence.
_Avoid_: Push, notification

**Dose window**:
One or more dose occurrences scheduled for the same minute and presented together in a single alarm experience while preserving an independent action for each dose.
_Avoid_: Dose group, combined dose

**Full-screen alarm**:
An optional dose alarm that requests the user's immediate attention by opening a full-screen experience when Android permits it.
_Avoid_: Forced screen, guaranteed full screen

**Snooze**:
A user action that postpones a dose alarm for five minutes without recording the dose as taken or skipped.
_Avoid_: Reschedule, delay medication

**Taken dose**:
A dose occurrence for which the user explicitly recorded that the medication was taken.
_Avoid_: Completed medication

**Unrecorded dose**:
A past dose occurrence for which the user made no explicit taken, skipped, or snoozed action before the day ended.
_Avoid_: Missed dose, forgotten dose

**Local profile**:
The person's display name stored only on the device and used to personalize MedMinder. It is not an account, login, or cloud identity.
_Avoid_: User account, registered user

**First-run onboarding**:
The one-time flow shown before the main app on a fresh installation. It introduces MedMinder, collects the required local-profile name, explains the core workflow, and offers reminder permissions in dependency order.
_Avoid_: Registration, sign-up

**Daily adherence**:
The percentage of dose occurrences scheduled for one local calendar day whose latest recorded action is taken. Skipped, snoozed, and unrecorded doses do not increase adherence. A day without scheduled doses has no adherence percentage.
_Avoid_: Medication completion, seven-day total
