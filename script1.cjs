const fs = require('fs');

function replaceAll(str, mapObj) {
    let result = str;
    for (const [key, value] of Object.entries(mapObj)) {
        result = result.split(key).join(value);
    }
    return result;
}

const laporanPath = '/Applications/laravel/jobportal/resources/js/pages/admin/laporan.tsx';
let laporanContent = fs.readFileSync(laporanPath, 'utf8');

// Laporan
const laporanReplacements = {
    // 1. Add hook to main component
    'export default function AdminLaporan({': 'export default function AdminLaporan({\n',
    // We will inject the hook manually using a targeted replace

    // KPIS
    "'Total Revenue'": "t('admin.reports.kpi.total_revenue')",
    "'Semua waktu'": "t('admin.reports.kpi.all_time')",
    "'Revenue 30 Hari'": "t('admin.reports.kpi.revenue_30_days')",
    "\\`${summary.revenue_count_30d} transaksi\\`": "\\`\\${summary.revenue_count_30d} \\${t('admin.reports.kpi.transactions').replace('{count}', '')}\\`.trim()",
    "'Subscription Aktif'": "t('admin.reports.kpi.active_subscriptions')",
    "\\`${subscriptionStats.expired} expired · ${subscriptionStats.cancelled} batal\\`": "t('admin.reports.kpi.subscription_stats').replace('{expired}', subscriptionStats.expired.toString()).replace('{cancelled}', subscriptionStats.cancelled.toString())",
    "'Pengguna Baru'": "t('admin.reports.kpi.new_users')",
    "'30 hari terakhir'": "t('admin.reports.kpi.last_30_days')",
    "'Perusahaan Baru'": "t('admin.reports.kpi.new_companies')",
    "'Lamaran Baru'": "t('admin.reports.kpi.new_applications')",

    // Head and Header
    'title="Laporan & Analitik"': 'title={t(\'admin.reports.title\')}',
    '>\n                            Laporan & Analitik\n                        </h1>': '>\n                            {t(\'admin.reports.title\')}\n                        </h1>',
    '>\n                            Pantau perkembangan platform dan export data ke Excel.\n                        </p>': '>\n                            {t(\'admin.reports.subtitle\')}\n                        </p>',

    // Cards
    'CardTitle className="text-base">Tren Revenue</CardTitle>': 'CardTitle className="text-base">{t(\'admin.reports.charts.revenue_trend\')}</CardTitle>',
    'CardDescription className="text-xs">\n                                12 bulan terakhir\n                            </CardDescription>': 'CardDescription className="text-xs">\n                                {t(\'admin.reports.charts.last_12_months\')}\n                            </CardDescription>',
    'CardTitle className="text-base">Revenue per Paket</CardTitle>': 'CardTitle className="text-base">{t(\'admin.reports.charts.revenue_per_plan\')}</CardTitle>',
    'CardDescription className="text-xs">\n                                Distribusi berdasarkan pricing plan\n                            </CardDescription>': 'CardDescription className="text-xs">\n                                {t(\'admin.reports.charts.revenue_per_plan_desc\')}\n                            </CardDescription>',
    'CardTitle className="text-base">\n                                Pertumbuhan Platform\n                            </CardTitle>': 'CardTitle className="text-base">\n                                {t(\'admin.reports.charts.platform_growth\')}\n                            </CardTitle>',
    'CardDescription className="text-xs">\n                                Perusahaan, pengguna, dan lamaran baru per bulan (12 bulan)\n                            </CardDescription>': 'CardDescription className="text-xs">\n                                {t(\'admin.reports.charts.platform_growth_desc\')}\n                            </CardDescription>',
    'CardTitle className="text-base">Status Pembayaran</CardTitle>': 'CardTitle className="text-base">{t(\'admin.reports.charts.payment_status\')}</CardTitle>',
    'CardDescription className="text-xs">\n                                Distribusi status transaksi\n                            </CardDescription>': 'CardDescription className="text-xs">\n                                {t(\'admin.reports.charts.payment_status_desc\')}\n                            </CardDescription>',

    // Top Companies
    'CardTitle className="text-base">\n                                Top 10 Perusahaan by Revenue\n                            </CardTitle>': 'CardTitle className="text-base">\n                                {t(\'admin.reports.top_companies.title\')}\n                            </CardTitle>',
    'CardDescription className="text-xs">\n                                Peringkat berdasarkan total pembayaran\n                            </CardDescription>': 'CardDescription className="text-xs">\n                                {t(\'admin.reports.top_companies.desc\')}\n                            </CardDescription>',
    '>\n                                                #\n                                            </th>': '>\n                                                {t(\'admin.reports.top_companies.th_hash\')}\n                                            </th>',
    '>\n                                                Perusahaan\n                                            </th>': '>\n                                                {t(\'admin.reports.top_companies.th_company\')}\n                                            </th>',
    '>\n                                                Kota\n                                            </th>': '>\n                                                {t(\'admin.reports.top_companies.th_city\')}\n                                            </th>',
    '>\n                                                Transaksi\n                                            </th>': '>\n                                                {t(\'admin.reports.top_companies.th_transactions\')}\n                                            </th>',
    '>\n                                                Total Revenue\n                                            </th>': '>\n                                                {t(\'admin.reports.top_companies.th_total_revenue\')}\n                                            </th>',

    // Export Section
    '<h2 className="text-base font-semibold">Export Data</h2>': '<h2 className="text-base font-semibold">{t(\'admin.reports.export.title\')}</h2>',
    '<p className="text-xs text-muted-foreground">\n                                Atur filter lalu klik tombol untuk download file Excel\n                            </p>': '<p className="text-xs text-muted-foreground">\n                                {t(\'admin.reports.export.subtitle\')}\n                            </p>',
    '<p>\n                        File Excel langsung terdownload. Kosongkan filter untuk export semua data.\n                        Laporan Pengguna menghasilkan file dengan{\' \'}\n                        <span className="font-semibold">2 sheet</span>: Data User dan Data Perusahaan.\n                    </p>': '<p>\n                        {t(\'admin.reports.export.footer_1\')}\n                        {t(\'admin.reports.export.footer_2\')}{\' \'}\n                        <span className="font-semibold">{t(\'admin.reports.export.footer_sheet\')}</span>{t(\'admin.reports.export.footer_3\')}\n                    </p>',

    // Empty Chart
    'Belum ada data\n        </div>': '{t(\'admin.reports.charts.no_data\')}\n        </div>',

    // Export Cards (need t injected)
    // Actually, to make it easier, we will pass `t` from AdminLaporan, or we can use `useTranslate` inside each component.
    // Let's replace function definitions to include hook
    'function RevenueExportCard() {': 'function RevenueExportCard() {\n    const { t } = useTranslate();',
    'function LamaranExportCard() {': 'function LamaranExportCard() {\n    const { t } = useTranslate();',
    'function PenggunaExportCard() {': 'function PenggunaExportCard() {\n    const { t } = useTranslate();',
    'function SubscriptionExportCard() {': 'function SubscriptionExportCard() {\n    const { t } = useTranslate();',
    'function EmptyChart() {': 'function EmptyChart() {\n    const { t } = useTranslate();',

    // Revenue Export Card
    'title="Revenue & Transaksi"': 'title={t(\'admin.reports.export.revenue.title\')}',
    'desc="Pembayaran & subscription perusahaan"': 'desc={t(\'admin.reports.export.revenue.desc\')}',
    'label="Filter Status Pembayaran"': 'label={t(\'admin.reports.export.revenue.filter_label\')}',
    "{ value: 'paid', label: '✓ Paid — pembayaran berhasil' }": "{ value: 'paid', label: t('admin.reports.export.revenue.status_paid') }",
    "{ value: 'pending', label: '⏳ Pending — menunggu konfirmasi' }": "{ value: 'pending', label: t('admin.reports.export.revenue.status_pending') }",
    "{ value: 'failed', label: '✗ Failed — pembayaran gagal' }": "{ value: 'failed', label: t('admin.reports.export.revenue.status_failed') }",
    "{ value: 'refunded', label: '↩ Refunded — sudah direfund' }": "{ value: 'refunded', label: t('admin.reports.export.revenue.status_refunded') }",
    'placeholder="Semua status (default)"': 'placeholder={t(\'admin.reports.export.filter_all_status\')}',

    // Lamaran Export Card
    'title="Lamaran Kandidat"': 'title={t(\'admin.reports.export.applications.title\')}',
    'desc="Aktivitas lamaran kerja kandidat"': 'desc={t(\'admin.reports.export.applications.desc\')}',
    'label="Filter Status Lamaran"': 'label={t(\'admin.reports.export.applications.filter_label\')}',
    "{ value: 'applied', label: 'Melamar' }": "{ value: 'applied', label: t('admin.reports.export.applications.status_applied') }",
    "{ value: 'screened', label: 'Seleksi Awal' }": "{ value: 'screened', label: t('admin.reports.export.applications.status_screened') }",
    "{ value: 'shortlisted', label: 'Shortlist' }": "{ value: 'shortlisted', label: t('admin.reports.export.applications.status_shortlisted') }",
    "{ value: 'interview', label: 'Interview' }": "{ value: 'interview', label: t('admin.reports.export.applications.status_interview') }",
    "{ value: 'offer', label: 'Penawaran' }": "{ value: 'offer', label: t('admin.reports.export.applications.status_offer') }",
    "{ value: 'hired', label: 'Diterima' }": "{ value: 'hired', label: t('admin.reports.export.applications.status_hired') }",
    "{ value: 'rejected', label: 'Ditolak' }": "{ value: 'rejected', label: t('admin.reports.export.applications.status_rejected') }",
    "{ value: 'withdrawn', label: 'Undur Diri' }": "{ value: 'withdrawn', label: t('admin.reports.export.applications.status_withdrawn') }",

    // Pengguna Export Card
    'title="Pengguna & Perusahaan"': 'title={t(\'admin.reports.export.users.title\')}',
    'desc="File Excel dengan 2 sheet"': 'desc={t(\'admin.reports.export.users.desc\')}',
    'label="Filter Role Pengguna"': 'label={t(\'admin.reports.export.users.filter_label\')}',
    "{ value: 'candidate', label: 'Kandidat' }": "{ value: 'candidate', label: t('admin.reports.export.users.role_candidate') }",
    "{ value: 'employer', label: 'Employer' }": "{ value: 'employer', label: t('admin.reports.export.users.role_employer') }",
    "{ value: 'mentor', label: 'Mentor' }": "{ value: 'mentor', label: t('admin.reports.export.users.role_mentor') }",
    'placeholder="Semua role (default)"': 'placeholder={t(\'admin.reports.export.users.filter_all_roles\')}',

    // Subscription Export Card
    'title="Subscription"': 'title={t(\'admin.reports.export.subscription.title\')}',
    'desc="Data langganan aktif & histori"': 'desc={t(\'admin.reports.export.subscription.desc\')}',
    'label="Filter Status Subscription"': 'label={t(\'admin.reports.export.subscription.filter_label\')}',
    "{ value: 'active', label: '✓ Aktif — sedang berjalan' }": "{ value: 'active', label: t('admin.reports.export.subscription.status_active') }",
    "{ value: 'expired', label: '⏰ Expired — sudah berakhir' }": "{ value: 'expired', label: t('admin.reports.export.subscription.status_expired') }",
    "{ value: 'cancelled', label: '✗ Dibatalkan' }": "{ value: 'cancelled', label: t('admin.reports.export.subscription.status_cancelled') }",

    // Primitives
    'function ExportCard({': 'function ExportCard({\n    const { t } = useTranslate();',
    '>\n                                2 sheet\n                            </Badge>': '>\n                                {t(\'admin.reports.export.footer_sheet\')}\n                            </Badge>',
    'Download Excel\n                        </Button>': '{t(\'admin.reports.export.download_btn\')}\n                        </Button>',
    'function DateRangePicker({': 'function DateRangePicker({\n    const { t } = useTranslate();',
    'Label className="text-xs font-medium">Rentang Tanggal</Label>': 'Label className="text-xs font-medium">{t(\'admin.reports.export.date_range\')}</Label>',
    'placeholder="Tanggal mulai"': 'placeholder={t(\'admin.reports.export.date_start\')}',
    'placeholder="Tanggal akhir"': 'placeholder={t(\'admin.reports.export.date_end\')}',
    '>\n                    Hapus filter tanggal\n                </button>': '>\n                    {t(\'admin.reports.export.clear_date\')}\n                </button>',

    // Charts
    "function RevenueAreaChart({ points }: { points: Point[] }) {": "function RevenueAreaChart({ points }: { points: Point[] }) {\n    const { t } = useTranslate();",
    "const series = [{ name: 'Revenue', data: points.map((p) => p.total) }];": "const series = [{ name: t('admin.reports.charts.legend_total'), data: points.map((p) => p.total) }];",
    "function GrowthBarChart({": "function GrowthBarChart({\n    const { t } = useTranslate();",
    "const series = [\n        { name: 'Perusahaan', data: companySeries.map((p) => p.total) },\n        { name: 'Pengguna', data: userSeries.map((p) => p.total) },\n        { name: 'Lamaran', data: applicationSeries.map((p) => p.total) },\n    ];": "const series = [\n        { name: t('admin.reports.charts.legend_company'), data: companySeries.map((p) => p.total) },\n        { name: t('admin.reports.charts.legend_user'), data: userSeries.map((p) => p.total) },\n        { name: t('admin.reports.charts.legend_application'), data: applicationSeries.map((p) => p.total) },\n    ];",
    "function RevenueByPlanDonut({": "function RevenueByPlanDonut({\n    const { t } = useTranslate();",
    "label: 'Total',": "label: t('admin.reports.charts.legend_total'),",
    "function PaymentStatusDonut({": "function PaymentStatusDonut({\n    const { t } = useTranslate();",
    "label: 'Transaksi',": "label: t('admin.reports.charts.legend_transactions'),",

    // Months
    "function shortMonth(ym: string): string {": "function shortMonth(ym: string, t: any): string {",
    "const months = [\n        'Jan','Feb','Mar','Apr','Mei','Jun',\n        'Jul','Ags','Sep','Okt','Nov','Des',\n    ];": "const months = [\n        t('admin.reports.months.jan'), t('admin.reports.months.feb'), t('admin.reports.months.mar'), t('admin.reports.months.apr'), t('admin.reports.months.may'), t('admin.reports.months.jun'),\n        t('admin.reports.months.jul'), t('admin.reports.months.aug'), t('admin.reports.months.sep'), t('admin.reports.months.oct'), t('admin.reports.months.nov'), t('admin.reports.months.dec'),\n    ];",
    "categories: points.map((p) => shortMonth(p.month))": "categories: points.map((p) => shortMonth(p.month, t))",
    "const categories = companySeries.map((p) => shortMonth(p.month));": "const categories = companySeries.map((p) => shortMonth(p.month, t));",
    "function formatDateDisplay(iso: string): string {": "function formatDateDisplay(iso: string, t: any): string {",
    "const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];": "const months = [\n        t('admin.reports.months.jan'), t('admin.reports.months.feb'), t('admin.reports.months.mar'), t('admin.reports.months.apr'), t('admin.reports.months.may'), t('admin.reports.months.jun'),\n        t('admin.reports.months.jul'), t('admin.reports.months.aug'), t('admin.reports.months.sep'), t('admin.reports.months.oct'), t('admin.reports.months.nov'), t('admin.reports.months.dec'),\n    ];",
    "{value ? formatDateDisplay(value) : placeholder}": "{value ? formatDateDisplay(value, t) : placeholder}",
    "function DatePicker({": "function DatePicker({\n    const { t } = useTranslate();"
};

// Add hook to AdminLaporan manually to not conflict with the `export default function` replacement
laporanContent = laporanContent.replace(
    'subscriptionStats,\n}: LaporanProps) {',
    'subscriptionStats,\n}: LaporanProps) {\n    const { t } = useTranslate();'
);

// We need to fix the parameters for Primitives (ExportCard doesn't receive `t` as props, we added it using hook above, wait ExportCard has its props destructuring inside `function ExportCard({ accentColor, ... }) {`, so using hook is tricky without destructuring syntax.
// Let's replace the EXACT declaration:
laporanContent = laporanContent.replace(
    'multiSheet?: boolean;\n    children: React.ReactNode;\n}) {',
    'multiSheet?: boolean;\n    children: React.ReactNode;\n}) {\n    const { t } = useTranslate();'
);

laporanContent = laporanContent.replace(
    'onEndChange: (v: string) => void;\n}) {',
    'onEndChange: (v: string) => void;\n}) {\n    const { t } = useTranslate();'
);

laporanContent = laporanContent.replace(
    'maxDate?: Date;\n}) {',
    'maxDate?: Date;\n}) {\n    const { t } = useTranslate();'
);

// Actually, in `ExportCard` declaration, `function ExportCard({\n    accentColor,`
laporanContent = laporanContent.replace('function ExportCard({\n    const { t } = useTranslate();', 'function ExportCard({'); // Revert my previous regex which is broken

laporanContent = replaceAll(laporanContent, laporanReplacements);

fs.writeFileSync(laporanPath, laporanContent, 'utf8');
console.log('Laporan done');
