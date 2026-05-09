# Translation Agent Workflow (i18n bulk refactor)

This directory holds per-batch partial JSON files produced by parallel agents.
After all agents finish, partials are merged into `lang/id.json` + `lang/en.json`.

## Rules for each agent

### What to translate (UI text only)
- JSX text content: `<p>Halo</p>` → `<p>{t('key')}</p>`
- `placeholder="..."`, `title="..."`, `aria-label="..."`, `alt="..."`
- Toast/dialog/error message strings passed to functions
- Button labels, link text
- Const arrays with `label`/`title`/`description` strings (move inside component or use t() inside JSX render)

### What to NOT translate
- `className` / Tailwind classes
- Route names / URL paths (`'/admin/dashboard'`, `route('foo')`)
- Type/role/status string values (`role: 'candidate'`, `status === 'active'`)
- Object keys, data IDs, query keys
- Conditional comparison strings (`if (type === 'manual')`)
- Console logs / debug strings
- Brand names (Karivia, Google, WhatsApp)
- Already-pure-English neutral terms used as identifiers

### Code pattern
1. Add import: `import { useTranslate } from '@/hooks/use-translate';`
2. Inside component function (top, after `usePage()` etc):
   `const { t } = useTranslate();`
3. For module-level `const X = [{ label: 'Lowongan' }]`: move inside component AND wrap with `useMemo(() => [...], [t])` to keep referential stability.

### Key naming convention
`<folder>.<filename_without_ext>.<short_semantic_label>`

Examples:
- `admin.dashboard.title` = "Dashboard Admin"
- `candidate.applications.empty_state` = "Belum ada lamaran"
- `employer.jobs.create.cta` = "Buat Lowongan"

Use snake_case for the suffix.

### Partial JSON format
File path: `lang/_auto_partials/<batch_name>.json`

```json
{
  "admin.dashboard.title": {
    "id": "Dashboard Admin",
    "en": "Admin Dashboard"
  },
  "admin.dashboard.welcome_message": {
    "id": "Selamat datang kembali",
    "en": "Welcome back"
  }
}
```

### Translation quality
- For `id`: use the EXACT original Indonesian text (preserve case, punctuation)
- For `en`: provide a natural English equivalent (not literal Google-Translate)

### Verify before finishing
- File still valid TypeScript (no syntax errors from your edits)
- All `useTranslate` imports added where used
- The JSON partial file is valid JSON (no trailing commas)
- DO NOT touch existing `t('...')` calls
