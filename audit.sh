#!/bin/bash

echo "--- 1.1 TODOs ---"
grep -rn -E "TODO|FIXME|HACK|XXX|TEMP" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | sort

echo "--- 1.2 Console.log ---"
grep -rn "console\." src/ --include="*.ts" --include="*.tsx" | grep -v "// eslint-disable" | head -50

echo "--- 1.3 Imports quebrados, any ---"
grep -rn "@ts-ignore\|@ts-nocheck\|: any\b" src/ --include="*.ts" --include="*.tsx" | head -30

echo "--- 1.4 Mocks ---"
grep -rn -E "mock|fake|placeholder|dummy|lorem|TEMP" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|test\|spec" | head -40

echo "--- 1.5 Build ---"
npm run build 2>&1 | tee build_output.log

echo "--- 1.6 TSC ---"
npx tsc --noEmit 2>&1 | tee typecheck_output.log

echo "--- 1.7 Lint ---"
npm run lint 2>&1 | tee lint_output.log

echo "--- 2. Rotas ---"
find src/app/ -name "page.tsx"

echo "--- 3.1 Server Actions ---"
grep -rn "use server" src/lib/ --include="*.ts"
grep -rn "export async function" src/lib/ --include="*actions*.ts"

echo "--- 4.1 Permissoes Helpers ---"
grep -rn "kph_is_founder\|kph_has_role\|requireRole\|requireUser" src/ --include="*.ts"

echo "--- 4.2 Rotas sem check ---"
find src/app/\(dashboard\) -name "page.tsx" | while read f; do
  if ! grep -q "requireUser\|requireRole" "$f"; then
    echo "SEM CHECK: $f"
  fi
done

echo "--- 4.3 Mock residual ---"
grep -rn "ac559fa1-f10b-4ec4-9f4b-fafbc881a884\|TEMP\|mock" src/lib/auth/ src/proxy.ts src/middleware.ts 2>/dev/null

echo "--- 5.1 Env Vars ---"
grep -rohE "process\.env\.[A-Z_]+" src/ | sort -u

echo "--- 5.3 Fetch External ---"
grep -rn "fetch(" src/ --include="*.ts" --include="*.tsx" | head -20

echo "--- 6.1 Tables ---"
grep -rohE "\.from\(['\"]\w+['\"]\)" src/ | sort -u

echo "--- 6.2 Migrations ---"
ls supabase/migrations/
