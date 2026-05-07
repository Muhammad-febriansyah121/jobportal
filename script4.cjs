const fs = require('fs');

function processFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Add import if missing
    if (!content.includes('useTranslate')) {
        // Find the last import
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
            content = content.slice(0, endOfLastImport) + "import { useTranslate } from '@/hooks/use-translate';\n" + content.slice(endOfLastImport);
        } else {
            content = "import { useTranslate } from '@/hooks/use-translate';\n" + content;
        }
    }

    // Add const { t } = useTranslate(); inside components
    // We will do this manually for the main components by finding their declarations.
    // Let's do simple string replacements first for the text

    for (const [oldStr, newStr] of replacements) {
        content = content.replace(oldStr, newStr);
    }

    fs.writeFileSync(path, content, 'utf8');
}

const assessmentIndex = '/Applications/laravel/jobportal/resources/js/pages/admin/assessment-questions/index.tsx';
processFile(assessmentIndex, [
    ['export default function AdminAssessmentQuestionIndex({ skills, create_url }: Props) {', 'export default function AdminAssessmentQuestionIndex({ skills, create_url }: Props) {\n    const { t } = useTranslate();'],
    ['<Head title="Bank Soal Assessment" />', '<Head title={t("admin.assessment.index.title")} />'],
    ['title="Bank Soal Assessment"', 'title={t("admin.assessment.index.title")}'],
    ['description="Kelola soal quiz per skill. Klik Detail untuk melihat dan mengelola soal dalam satu skill."', 'description={t("admin.assessment.index.desc")}'],
    ["label: 'Tambah / Generate Soal',", "label: t('admin.assessment.index.btn_add'),"],
    ['>total soal<', '>{t("admin.assessment.index.total_questions")}<'],
    ['>skill memiliki soal<', '>{t("admin.assessment.index.skills_with_questions")}<'],
    ['>Skill dengan soal<', '>{t("admin.assessment.index.section_with_questions")}<'],
    ['>Skill belum ada soal<', '>{t("admin.assessment.index.section_without_questions")}<'],
    ['>Generate<', '>{t("admin.assessment.index.btn_generate")}<'],
    ['>Belum ada skill<', '>{t("admin.assessment.index.empty_title")}<'],
    ['>Tambah skill terlebih dahulu di menu Skills.<', '>{t("admin.assessment.index.empty_desc")}<'],
    ['aktif · {', "aktif · {"], // wait
    ['aktif · ', " {t('admin.assessment.index.card_active')} · "],
    [' nonaktif', " {t('admin.assessment.index.card_inactive')}"],
    ['>Detail<', '>{t("admin.assessment.index.btn_detail")}<'],
    ["function SkillCard({ skill }: { skill: SkillCard }) {", "function SkillCard({ skill }: { skill: SkillCard }) {\n    const { t } = useTranslate();"]
]);

const assessmentShow = '/Applications/laravel/jobportal/resources/js/pages/admin/assessment-questions/show.tsx';
processFile(assessmentShow, [
    ['export default function AdminAssessmentQuestionShow({', 'export default function AdminAssessmentQuestionShow({\n    skill,\n    questions,\n    filters,\n    index_url,\n    create_url,\n}: Props) {\n    const { t } = useTranslate();\n\n    // '],
    ['<Head title={`Bank Soal — ${skill.name}`} />', '<Head title={t("admin.assessment.show.title", { skill: skill.name })} />'],
    ['title={`Bank Soal: ${skill.name}`}', 'title={t("admin.assessment.show.title", { skill: skill.name })}'],
    ['description={`${questions.total} soal tersedia. Kelola, edit, atau hapus soal untuk skill ini.`}', 'description={t("admin.assessment.show.desc", { total: questions.total })}'],
    ["label: 'Tambah / Generate Soal',", "label: t('admin.assessment.index.btn_add'),"],
    ['placeholder="Cari pertanyaan..."', 'placeholder={t("admin.assessment.show.search_placeholder")}'],
    ['>Cari<', '>{t("admin.assessment.show.btn_search")}<'],
    ['placeholder="Level"', 'placeholder={t("admin.assessment.show.filter_level")}'],
    ['>Semua level<', '>{t("admin.assessment.show.filter_level_all")}<'],
    ['placeholder="Status"', 'placeholder={t("admin.assessment.show.filter_status")}'],
    ['>Semua status<', '>{t("admin.assessment.show.filter_status_all")}<'],
    ['>Aktif<', '>{t("admin.assessment.show.status_active")}<'],
    ['>Nonaktif<', '>{t("admin.assessment.show.status_inactive")}<'],
    ['>Belum ada soal<', '>{t("admin.assessment.show.empty_title")}<'],
    ['>Generate soal dengan AI atau tambah manual.<', '>{t("admin.assessment.show.empty_desc")}<'],
    ['>Generate dengan AI<', '>{t("admin.assessment.show.btn_generate_ai")}<'],
    ['>Hapus soal?<', '>{t("admin.assessment.show.dialog_delete_title")}<'],
    ['>Soal ini akan dihapus permanen dari bank soal.<', '>{t("admin.assessment.show.dialog_delete_desc")}<'],
    ['>Batal<', '>{t("admin.assessment.show.btn_cancel")}<'],
    [">{isDeleting ? 'Menghapus...' : 'Hapus'}<", ">{isDeleting ? t('admin.assessment.show.btn_deleting') : t('admin.assessment.show.btn_delete')}<"],
    ["function QuestionCard({", "function QuestionCard({\n    question,\n    number,\n    onDelete,\n}: {\n    question: Question;\n    number: number;\n    onDelete: () => void;\n}) {\n    const { t } = useTranslate();"],
    ['>Aktif<', '>{t("admin.assessment.show.status_active")}<'],
    ['>Nonaktif<', '>{t("admin.assessment.show.status_inactive")}<'],
    ['>Edit<', '>{t("admin.assessment.show.btn_edit")}<'],
    ['>Hapus<', '>{t("admin.assessment.show.btn_delete")}<'],
    ["{question.is_active ? 'Aktif' : 'Nonaktif'}", "{question.is_active ? t('admin.assessment.show.status_active') : t('admin.assessment.show.status_inactive')}"]
]);

const assessmentForm = '/Applications/laravel/jobportal/resources/js/pages/admin/assessment-questions/form.tsx';
processFile(assessmentForm, [
    ['export function AssessmentQuestionForm({', 'export function AssessmentQuestionForm({\n    action,\n    method = \'post\',\n    difficultyOptions,\n    question,\n    skillOptions,\n}: {\n    action: string;\n    method?: \'patch\' | \'post\';\n    difficultyOptions: Option[];\n    question?: AssessmentQuestionValue;\n    skillOptions: Option[];\n}) {\n    const { t } = useTranslate();'],
    ['>Skill<', '>{t("admin.assessment.form.skill")}<'],
    ['placeholder="Pilih skill"', 'placeholder={t("admin.assessment.form.skill_placeholder")}'],
    ['>Level<', '>{t("admin.assessment.form.level")}<'],
    ['>Mode Input<', '>{t("admin.assessment.form.mode")}<'],
    ['>Manual (1 soal)<', '>{t("admin.assessment.form.mode_manual")}<'],
    ['>Generate AI (batch)<', '>{t("admin.assessment.form.mode_ai")}<'],
    ['>Jumlah Soal AI<', '>{t("admin.assessment.form.ai_count")}<'],
    ['>Soal Manual ({questionItems.length})<', '>{t("admin.assessment.form.manual_title", { count: questionItems.length })}<'],
    ['>Tambah Soal<', '>{t("admin.assessment.form.btn_add_manual")}<'],
    ['>Pertanyaan #{index + 1}<', '>{t("admin.assessment.form.question_num", { num: index + 1 })}<'],
    ['>Hapus<', '>{t("admin.assessment.form.btn_remove")}<'],
    ['>Pertanyaan<', '>{t("admin.assessment.form.question")}<'],
    ['placeholder="Masukkan pertanyaan"', 'placeholder={t("admin.assessment.form.question_placeholder")}'],
    ['label="Opsi A"', 'label={t("admin.assessment.form.option_a")}'],
    ['label="Opsi B"', 'label={t("admin.assessment.form.option_b")}'],
    ['label="Opsi C"', 'label={t("admin.assessment.form.option_c")}'],
    ['label="Opsi D"', 'label={t("admin.assessment.form.option_d")}'],
    ['>Jawaban Benar<', '>{t("admin.assessment.form.correct_answer")}<'],
    ['>Soal aktif<', '>{t("admin.assessment.form.is_active")}<'],
    ["? 'Menyimpan...'", "? t('admin.assessment.form.btn_saving')"],
    [": 'Generate Soal AI'", ": t('admin.assessment.form.btn_save_ai')"],
    [": 'Simpan Soal'", ": t('admin.assessment.form.btn_save_manual')"],
    ["function SearchableOptionSelect({", "function SearchableOptionSelect({\n    onChange,\n    options,\n    placeholder,\n    value,\n}: {\n    onChange: (value: string) => void;\n    options: Option[];\n    placeholder: string;\n    value: string;\n}) {\n    const { t } = useTranslate();"],
    ['placeholder="Cari skill..."', 'placeholder={t("admin.assessment.form.search_skill")}'],
    ['>Skill tidak ditemukan.<', '>{t("admin.assessment.form.skill_not_found")}<']
]);

const pricingForm = '/Applications/laravel/jobportal/resources/js/pages/admin/candidate-pricing-menus/form.tsx';
processFile(pricingForm, [
    ['export function CandidatePricingMenuForm({', 'export function CandidatePricingMenuForm({\n    action,\n    method = \'post\',\n    menu,\n}: {\n    action: string;\n    method?: \'patch\' | \'post\';\n    menu?: CandidatePricingMenuValue;\n}) {\n    const { t } = useTranslate();'],
    ["toast.error('Periksa kembali data pricing kandidat.');", "toast.error(t('admin.pricing.form.error_toast'));"],
    ['>Informasi Paket<', '>{t("admin.pricing.form.section_info_title")}<'],
    ['>Nama paket kandidat, harga topup, dan status publikasi.<', '>{t("admin.pricing.form.section_info_desc")}<'],
    ['>Nama Paket<', '>{t("admin.pricing.form.name")}<'],
    ['placeholder="Contoh: Topup AI 5.000 Token"', 'placeholder={t("admin.pricing.form.name_placeholder")}'],
    ['>Deskripsi<', '>{t("admin.pricing.form.desc")}<'],
    ['placeholder="Jelaskan kegunaan paket ini untuk kandidat."', 'placeholder={t("admin.pricing.form.desc_placeholder")}'],
    ['>Harga<', '>{t("admin.pricing.form.price")}<'],
    ['>Paket gratis default<', '>{t("admin.pricing.form.default_free")}<'],
    ['>Dipakai untuk akses CV Builder pertama kandidat.<', '>{t("admin.pricing.form.default_free_desc")}<'],
    ['>Paket aktif<', '>{t("admin.pricing.form.is_active")}<'],
    ['>Paket bisa ditampilkan di flow pricing kandidat.<', '>{t("admin.pricing.form.is_active_desc")}<'],
    ['>Kuota Paket<', '>{t("admin.pricing.form.section_quota_title")}<'],
    ['>Tentukan jumlah token AI dan kuota penggunaan CV Builder.<', '>{t("admin.pricing.form.section_quota_desc")}<'],
    ['label="Jumlah token AI"', 'label={t("admin.pricing.form.ai_token")}'],
    ['label="Kuota CV Builder"', 'label={t("admin.pricing.form.cv_quota")}'],
    ['>Benefit Paket<', '>{t("admin.pricing.form.section_benefit_title")}<'],
    ['>Tulis satu benefit per baris agar tampil jelas di halaman pricing.<', '>{t("admin.pricing.form.section_benefit_desc")}<'],
    ['>Tambah Benefit<', '>{t("admin.pricing.form.btn_add_benefit")}<'],
    ['placeholder="Contoh: 1x CV Builder tambahan"', 'placeholder={t("admin.pricing.form.benefit_placeholder")}'],
    ['>Preview Paket<', '>{t("admin.pricing.form.preview_title")}<'],
    ["{form.data.is_active ? 'Aktif' : 'Nonaktif'}", "{form.data.is_active ? t('admin.pricing.form.status_active') : t('admin.pricing.form.status_inactive')}"],
    ["{form.data.name || 'Nama Paket Kandidat'}", "{form.data.name || t('admin.pricing.form.preview_name_empty')}"],
    ['>harga paket<', '>{t("admin.pricing.form.preview_price_desc")}<'],
    ["? 'Paket Gratis Default'", "? t('admin.pricing.form.badge_free')"],
    [": 'Paket Topup'", ": t('admin.pricing.form.badge_topup')"],
    ['>Simpan Perubahan<', '>{t("admin.pricing.form.section_save_title")}<'],
    ['>Setelah tersimpan, notifikasi Sonner akan muncul otomatis.<', '>{t("admin.pricing.form.section_save_desc")}<'],
    ["? 'Menyimpan...'", "? t('admin.pricing.form.btn_saving')"],
    [": 'Simpan Paket'", ": t('admin.pricing.form.btn_save')"],
    ["label=\"Token AI\"", "label={t(\"admin.pricing.show.metric_ai\")}"],
    ["label=\"Kuota CV Builder\"", "label={t(\"admin.pricing.show.metric_cv\")}"],
]);

const pricingShow = '/Applications/laravel/jobportal/resources/js/pages/admin/candidate-pricing-menus/show.tsx';
processFile(pricingShow, [
    ['export default function CandidatePricingMenuShow({', 'export default function CandidatePricingMenuShow({\n    title,\n    description,\n    backHref,\n    menu,\n    actions = [],\n}: CandidatePricingMenuShowProps) {\n    const { t } = useTranslate();\n\n    // '],
    ["{menu.is_default_free ? 'Gratis Default' : 'Topup'}", "{menu.is_default_free ? t('admin.pricing.show.badge_free') : t('admin.pricing.show.badge_topup')}"],
    ["{menu.is_active ? 'Aktif' : 'Nonaktif'}", "{menu.is_active ? t('admin.pricing.show.status_active') : t('admin.pricing.show.status_inactive')}"],
    ['>Pricing Kandidat<', '>{t("admin.pricing.show.section_title")}<'],
    ['>harga paket<', '>{t("admin.pricing.show.price_desc")}<'],
    ["|| 'Tidak ada deskripsi paket.'", "|| t('admin.pricing.show.empty_desc')"],
    ['>Belum ada benefit ditulis.<', '>{t("admin.pricing.show.empty_benefit")}<'],
    ['label="Token AI"', 'label={t("admin.pricing.show.metric_ai")}'],
    ['label="Kuota CV Builder"', 'label={t("admin.pricing.show.metric_cv")}'],
    ['label="Tipe Paket"', 'label={t("admin.pricing.show.metric_type")}'],
    ["value={menu.is_default_free ? 'Gratis' : 'Topup'}", "value={menu.is_default_free ? t('admin.pricing.show.type_free') : t('admin.pricing.show.type_topup')}"],
    ['>Audit Ringkas<', '>{t("admin.pricing.show.audit_title")}<'],
    ['label="Dibuat"', 'label={t("admin.pricing.show.audit_created")}'],
    ['label="Terakhir update"', 'label={t("admin.pricing.show.audit_updated")}'],
    ['label="Status"', 'label={t("admin.pricing.show.audit_status")}'],
    ["value={menu.is_active ? 'Aktif' : 'Nonaktif'}", "value={menu.is_active ? t('admin.pricing.show.status_active') : t('admin.pricing.show.status_inactive')}"]
]);

const pricingIndex = '/Applications/laravel/jobportal/resources/js/pages/admin/candidate-pricing-menus/index.tsx';
processFile(pricingIndex, [
    ['export default function CandidatePricingMenuIndex({', 'export default function CandidatePricingMenuIndex({\n    title,\n    description,\n    indexAction,\n    createHref,\n    filters,\n    columns,\n    rows,\n    emptyState,\n}: CandidatePricingMenuIndexProps) {\n    const { t } = useTranslate();\n\n    // '],
    ['>Tambah Menu<', '>{t("admin.pricing.index.btn_add")}<']
]);

console.log('React files processed successfully.');
