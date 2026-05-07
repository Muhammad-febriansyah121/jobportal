const fs = require('fs');

function fixSyntax(path, badPattern, replacement) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(badPattern, replacement);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. assessment-questions/form.tsx
// It has:
// export function AssessmentQuestionForm({
//     action,
//     method = 'post',
//     difficultyOptions,
//     question,
//     skillOptions,
// }: {
//     action: string;
//     method?: 'patch' | 'post';
//     difficultyOptions: Option[];
//     question?: AssessmentQuestionValue;
//     skillOptions: Option[];
// }) {
//     const { t } = useTranslate();
//     action,
//     method = 'post',
//     ...
// }) {
fixSyntax('/Applications/laravel/jobportal/resources/js/pages/admin/assessment-questions/form.tsx',
/export function AssessmentQuestionForm\(\{\s+action,\s+method = 'post',\s+difficultyOptions,\s+question,\s+skillOptions,\s+\}: \{\s+action: string;\s+method\?: 'patch' \| 'post';\s+difficultyOptions: Option\[\];\s+question\?: AssessmentQuestionValue;\s+skillOptions: Option\[\];\s+\}\) \{\s+const \{ t \} = useTranslate\(\);\s+action,\s+method = 'post',\s+difficultyOptions,\s+question,\s+skillOptions,\s+\}: \{\s+action: string;\s+method\?: 'patch' \| 'post';\s+difficultyOptions: Option\[\];\s+question\?: AssessmentQuestionValue;\s+skillOptions: Option\[\];\s+\}\) \{/s,
`export function AssessmentQuestionForm({
    action,
    method = 'post',
    difficultyOptions,
    question,
    skillOptions,
}: {
    action: string;
    method?: 'patch' | 'post';
    difficultyOptions: Option[];
    question?: AssessmentQuestionValue;
    skillOptions: Option[];
}) {
    const { t } = useTranslate();`
);

// SearchableOptionSelect
// It has:
// function SearchableOptionSelect({
//     onChange,
//     options,
//     placeholder,
//     value,
// }: {
//     ...
// }) {
//     const { t } = useTranslate();
//     onChange,
//     options,
//     ...
// }) {
fixSyntax('/Applications/laravel/jobportal/resources/js/pages/admin/assessment-questions/form.tsx',
/function SearchableOptionSelect\(\{\s+onChange,\s+options,\s+placeholder,\s+value,\s+\}: \{\s+onChange: \(value: string\) => void;\s+options: Option\[\];\s+placeholder: string;\s+value: string;\s+\}\) \{\s+const \{ t \} = useTranslate\(\);\s+onChange,\s+options,\s+placeholder,\s+value,\s+\}: \{\s+onChange: \(value: string\) => void;\s+options: Option\[\];\s+placeholder: string;\s+value: string;\s+\}\) \{/s,
`function SearchableOptionSelect({
    onChange,
    options,
    placeholder,
    value,
}: {
    onChange: (value: string) => void;
    options: Option[];
    placeholder: string;
    value: string;
}) {
    const { t } = useTranslate();`
);

// 2. assessment-questions/show.tsx
// AdminAssessmentQuestionShow
fixSyntax('/Applications/laravel/jobportal/resources/js/pages/admin/assessment-questions/show.tsx',
/export default function AdminAssessmentQuestionShow\(\{\s+skill,\s+questions,\s+filters,\s+index_url,\s+create_url,\s+\}: Props\) \{\s+const \{ t \} = useTranslate\(\);\s+\/\/ \s+skill,\s+questions,\s+filters,\s+index_url,\s+create_url,\s+\}: Props\) \{/s,
`export default function AdminAssessmentQuestionShow({
    skill,
    questions,
    filters,
    index_url,
    create_url,
}: Props) {
    const { t } = useTranslate();`
);

// QuestionCard
fixSyntax('/Applications/laravel/jobportal/resources/js/pages/admin/assessment-questions/show.tsx',
/function QuestionCard\(\{\s+question,\s+number,\s+onDelete,\s+\}: \{\s+question: Question;\s+number: number;\s+onDelete: \(\) => void;\s+\}\) \{\s+const \{ t \} = useTranslate\(\);\s+question,\s+number,\s+onDelete,\s+\}: \{\s+question: Question;\s+number: number;\s+onDelete: \(\) => void;\s+\}\) \{/s,
`function QuestionCard({
    question,
    number,
    onDelete,
}: {
    question: Question;
    number: number;
    onDelete: () => void;
}) {
    const { t } = useTranslate();`
);

// 3. candidate-pricing-menus/form.tsx
// CandidatePricingMenuForm
fixSyntax('/Applications/laravel/jobportal/resources/js/pages/admin/candidate-pricing-menus/form.tsx',
/export function CandidatePricingMenuForm\(\{\s+action,\s+method = 'post',\s+menu,\s+\}: \{\s+action: string;\s+method\?: 'patch' \| 'post';\s+menu\?: CandidatePricingMenuValue;\s+\}\) \{\s+const \{ t \} = useTranslate\(\);\s+action,\s+method = 'post',\s+menu,\s+\}: \{\s+action: string;\s+method\?: 'patch' \| 'post';\s+menu\?: CandidatePricingMenuValue;\s+\}\) \{/s,
`export function CandidatePricingMenuForm({
    action,
    method = 'post',
    menu,
}: {
    action: string;
    method?: 'patch' | 'post';
    menu?: CandidatePricingMenuValue;
}) {
    const { t } = useTranslate();`
);

// 4. candidate-pricing-menus/index.tsx
// CandidatePricingMenuIndex
fixSyntax('/Applications/laravel/jobportal/resources/js/pages/admin/candidate-pricing-menus/index.tsx',
/export default function CandidatePricingMenuIndex\(\{\s+title,\s+description,\s+indexAction,\s+createHref,\s+filters,\s+columns,\s+rows,\s+emptyState,\s+\}: CandidatePricingMenuIndexProps\) \{\s+const \{ t \} = useTranslate\(\);\s+\/\/ \s+title,\s+description,\s+indexAction,\s+createHref,\s+filters,\s+columns,\s+rows,\s+emptyState,\s+\}: CandidatePricingMenuIndexProps\) \{/s,
`export default function CandidatePricingMenuIndex({
    title,
    description,
    indexAction,
    createHref,
    filters,
    columns,
    rows,
    emptyState,
}: CandidatePricingMenuIndexProps) {
    const { t } = useTranslate();`
);

// 5. candidate-pricing-menus/show.tsx
// CandidatePricingMenuShow
fixSyntax('/Applications/laravel/jobportal/resources/js/pages/admin/candidate-pricing-menus/show.tsx',
/export default function CandidatePricingMenuShow\(\{\s+title,\s+description,\s+backHref,\s+menu,\s+actions = \[\],\s+\}: CandidatePricingMenuShowProps\) \{\s+const \{ t \} = useTranslate\(\);\s+\/\/ \s+title,\s+description,\s+backHref,\s+menu,\s+actions = \[\],\s+\}: CandidatePricingMenuShowProps\) \{/s,
`export default function CandidatePricingMenuShow({
    title,
    description,
    backHref,
    menu,
    actions = [],
}: CandidatePricingMenuShowProps) {
    const { t } = useTranslate();`
);

console.log('Syntax fixes applied!');
