# Date Utilities

Framework-agnostic date/time formatters used across frontend and backend for consistent date display.

## Functions

### `formatDate(date, options?)`

Flexible date/time formatter with optional configuration.

```typescript
import { formatDate } from '@/utils/date.utils';

// Default format
formatDate(new Date('2025-12-22'));
// → "22 Dec 2025"

// Without short month
formatDate(new Date('2025-12-22'), { shortMonth: false });
// → "22 December 2025"

// With weekday
formatDate(new Date('2025-12-22'), { includeWeekday: true });
// → "Sun, 22 Dec 2025"

// With time
formatDate(new Date('2025-12-22T14:30:00'), { includeTime: true });
// → "22 Dec 2025, 2:30 pm"

// Time only
formatDate(new Date('2025-12-22T14:30:00'), { timeOnly: true });
// → "2:30 pm"

// 24-hour format
formatDate(new Date('2025-12-22T14:30:00'), { timeOnly: true, use24Hour: true });
// → "14:30"
```

### Options

| Option           | Type    | Default   | Description                                    |
| ---------------- | ------- | --------- | ---------------------------------------------- |
| `locale`         | string  | `'en-IN'` | Locale for formatting (e.g., 'en-US', 'en-IN') |
| `timeOnly`       | boolean | `false`   | Show only time, no date                        |
| `includeTime`    | boolean | `false`   | Include time in output                         |
| `includeSeconds` | boolean | `false`   | Include seconds when time is shown             |
| `use24Hour`      | boolean | `false`   | Use 24-hour format                             |
| `shortMonth`     | boolean | `true`    | Use 'Jan' instead of 'January'                 |
| `shortDay`       | boolean | `true`    | Use 'Mon' instead of 'Monday'                  |
| `includeYear`    | boolean | `true`    | Include year in output                         |
| `includeWeekday` | boolean | `false`   | Include day of week                            |

---

### `formatDuration(seconds, options?)`

Formats seconds into human-readable duration.

```typescript
import { formatDuration } from '@/utils/date.utils';

formatDuration(3661);
// → "1 hour, 1 minute, 1 second"

formatDuration(3661, { short: true });
// → "1h 1m 1s"

formatDuration(90061);
// → "1 day, 1 hour, 1 minute"

formatDuration(45);
// → "45 seconds"
```

### Options

| Option           | Type    | Default | Description                                  |
| ---------------- | ------- | ------- | -------------------------------------------- |
| `short`          | boolean | `false` | Use 's', 'm', 'h', 'd' instead of full words |
| `includeSeconds` | boolean | `true`  | Include seconds in output                    |

---

### `formatISODate(date)`

Returns ISO date string (`YYYY-MM-DD`).

```typescript
formatISODate(new Date('2025-12-22T14:30:00'));
// → "2025-12-22"
```

---

### `formatISODateTime(date)`

Returns full ISO string.

```typescript
formatISODateTime(new Date('2025-12-22T14:30:00'));
// → "2025-12-22T14:30:00.000Z"
```
