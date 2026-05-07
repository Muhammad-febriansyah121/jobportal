const fs = require('fs');

function replaceAll(str, mapObj) {
    let result = str;
    for (const [key, value] of Object.entries(mapObj)) {
        result = result.split(key).join(value);
    }
    return result;
}

const settingsPath = '/Applications/laravel/jobportal/resources/js/pages/admin/settings.tsx';
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

const settingsReplacements = {
    // Inject hook into component
    'export default function AdminSettings({ settings }: SettingsProps) {': "export default function AdminSettings({ settings }: SettingsProps) {\n    const { t } = useTranslate();",

    // Titles
    'title="Setting Web"': "title={t('admin.settings.title')}",
    '>\n                                Setting Web\n                            </h1>': ">\n                                {t('admin.settings.title')}\n                            </h1>",
    '>\n                                Kelola konfigurasi umum, tampilan, dan informasi\n                                platform Karivia.\n                            </p>': ">\n                                {t('admin.settings.subtitle')}\n                            </p>",
    ">Simpan Perubahan<": ">{t('admin.settings.save_changes')}<",
    "processing ? 'Menyimpan...' : 'Simpan Perubahan'": "processing ? t('admin.settings.saving') : t('admin.settings.save_changes')",
    "'Periksa kembali pengaturan yang diisi.'": "t('admin.settings.error_message')",

    // Tabs
    "{ key: 'umum', label: 'Umum', icon: Globe }": "{ key: 'umum', label: t('admin.settings.tabs.general'), icon: Globe }",
    "{ key: 'media', label: 'Media', icon: ImageIcon }": "{ key: 'media', label: t('admin.settings.tabs.media'), icon: ImageIcon }",
    "{ key: 'sosial', label: 'Sosial & Kontak', icon: Share2 }": "{ key: 'sosial', label: t('admin.settings.tabs.social'), icon: Share2 }",
    "{ key: 'tentang', label: 'Tentang Kami', icon: Building2 }": "{ key: 'tentang', label: t('admin.settings.tabs.about'), icon: Building2 }",
    "{ key: 'ai', label: 'AI', icon: Bot }": "{ key: 'ai', label: t('admin.settings.tabs.ai'), icon: Bot }",
    "{ key: 'pembayaran', label: 'Pembayaran', icon: CreditCard }": "{ key: 'pembayaran', label: t('admin.settings.tabs.payment'), icon: CreditCard }",
    "{ key: 'sistem', label: 'Sistem', icon: ShieldOff }": "{ key: 'sistem', label: t('admin.settings.tabs.system'), icon: ShieldOff }",

    // General Section
    'title="Identitas Situs"': "title={t('admin.settings.general.identity')}",
    'label="Nama Situs"': "label={t('admin.settings.general.site_name')}",
    'label="Tagline"': "label={t('admin.settings.general.tagline')}",
    'label="Deskripsi Singkat"': "label={t('admin.settings.general.description')}",
    'label="Meta Description"': "label={t('admin.settings.general.meta_desc')}",
    'label="Meta Keywords"': "label={t('admin.settings.general.meta_keywords')}",
    'placeholder="Deskripsi situs..."': "placeholder={t('admin.settings.general.desc_placeholder')}",
    'placeholder="Meta description untuk SEO..."': "placeholder={t('admin.settings.general.meta_desc_placeholder')}",
    'placeholder="lowongan kerja, job portal, ..."': "placeholder={t('admin.settings.general.meta_keys_placeholder')}",

    // Media Section
    'title="Media & Gambar"': "title={t('admin.settings.media.title')}",
    'label="Logo Situs"': "label={t('admin.settings.media.logo')}",
    'aspectHint="Disarankan: 200×60px"': "aspectHint={t('admin.settings.media.logo_hint')}",
    'label="Favicon"': "label={t('admin.settings.media.favicon')}",
    'aspectHint="Disarankan: 32×32px atau 64×64px"': "aspectHint={t('admin.settings.media.favicon_hint')}",
    'label="Banner Halaman Login"': "label={t('admin.settings.media.login_banner')}",
    'aspectHint="Disarankan: 1200×800px"': "aspectHint={t('admin.settings.media.login_banner_hint')}",

    // Social Section
    'title="Media Sosial"': "title={t('admin.settings.social.title')}",
    'label="Facebook URL"': "label={t('admin.settings.social.facebook')}",
    'label="Instagram URL"': "label={t('admin.settings.social.instagram')}",
    'label="LinkedIn URL"': "label={t('admin.settings.social.linkedin')}",
    'label="Twitter / X URL"': "label={t('admin.settings.social.twitter')}",
    'label="YouTube URL"': "label={t('admin.settings.social.youtube')}",

    // Contact Section
    'title="Kontak"': "title={t('admin.settings.contact.title')}",
    'label="Email Support"': "label={t('admin.settings.contact.email')}",
    'label="Nomor Telepon"': "label={t('admin.settings.contact.phone')}",
    'label="Nomor WhatsApp"': "label={t('admin.settings.contact.whatsapp')}",

    // About Section
    'title="Halaman Tentang Kami"': "title={t('admin.settings.about.title')}",
    'label="Judul"': "label={t('admin.settings.about.page_title')}",
    'placeholder="Tentang Karivia"': "placeholder={t('admin.settings.about.title_placeholder')}",
    'placeholder="Tagline halaman about..."': "placeholder={t('admin.settings.about.tagline_placeholder')}",
    'label="Jumlah Karyawan"': "label={t('admin.settings.about.employee_count')}",
    'placeholder="50+ orang"': "placeholder={t('admin.settings.about.employee_count_placeholder')}",
    'label="Tahun Berdiri"': "label={t('admin.settings.about.founded_year')}",
    'label="Kantor Pusat"': "label={t('admin.settings.about.headquarters')}",
    'label="Deskripsi"': "label={t('admin.settings.about.description')}",
    'placeholder="Deskripsi singkat perusahaan..."': "placeholder={t('admin.settings.about.desc_placeholder')}",
    'label="Konten (HTML)"': "label={t('admin.settings.about.content')}",
    'placeholder="Tulis konten tentang perusahaan..."': "placeholder={t('admin.settings.about.content_placeholder')}",
    'label="Hero Image"': "label={t('admin.settings.about.hero_image')}",
    'aspectHint="Disarankan: 1200×600px"': "aspectHint={t('admin.settings.about.hero_hint')}",
    'label="Office Image"': "label={t('admin.settings.about.office_image')}",
    'aspectHint="Disarankan: 800×600px"': "aspectHint={t('admin.settings.about.office_hint')}",

    // AI Section
    'title="AI API Key"': "title={t('admin.settings.ai.title')}",
    'label="Model AI"': "label={t('admin.settings.ai.model')}",
    '>\n                                        Gunakan nama model persis seperti yang\n                                        didukung provider API kamu. Contoh:\n                                        gpt-5.\n                                    </p>': ">\n                                        {t('admin.settings.ai.model_hint')}\n                                    </p>",
    'label="API Key"': "label={t('admin.settings.ai.api_key')}",
    '>\n                                        Disimpan terenkripsi. API key digunakan\n                                        untuk fitur AI Summary, AI Insight, AI\n                                        Interview, dan AI Matching. Jangan\n                                        bagikan key ini kepada siapapun.\n                                    </p>': ">\n                                        {t('admin.settings.ai.api_key_hint')}\n                                    </p>",

    // Gateway Section
    'title="WhatsApp Gateway"': "title={t('admin.settings.wa_gateway.title')}",
    'label="Gateway URL"': "label={t('admin.settings.wa_gateway.url')}",
    '>\n                                        Base URL service WA gateway untuk fitur\n                                        notifikasi employer.\n                                    </p>': ">\n                                        {t('admin.settings.wa_gateway.url_hint')}\n                                    </p>",
    'label="Gateway API Key"': "label={t('admin.settings.wa_gateway.api_key')}",

    // Payment Section
    'title="Pakasir"': "title={t('admin.settings.payment.title')}",
    'label="Project Slug"': "label={t('admin.settings.payment.project_slug')}",
    '>\n                                        Slug proyek Pakasir kamu. Terlihat di\n                                        dashboard app.pakasir.com.\n                                    </p>': ">\n                                        {t('admin.settings.payment.project_slug_hint')}\n                                    </p>",
    '>\n                                        API key dari dashboard Pakasir. Jangan\n                                        bagikan key ini kepada siapapun.\n                                    </p>': ">\n                                        {t('admin.settings.payment.api_key_hint')}\n                                    </p>",

    // System Section
    'title="Mode Maintenance"': "title={t('admin.settings.system.maintenance_title')}",
    'label="Status Maintenance"': "label={t('admin.settings.system.maintenance_status')}",
    "'Aktif — situs dalam mode maintenance'": "t('admin.settings.system.maintenance_active')",
    "'Tidak aktif'": "t('admin.settings.system.maintenance_inactive')",
    'label="Pesan Maintenance"': "label={t('admin.settings.system.maintenance_message')}",
    'placeholder="Website sedang dalam pemeliharaan..."': "placeholder={t('admin.settings.system.maintenance_message_placeholder')}",

    'title="Peta Kantor"': "title={t('admin.settings.system.maps_title')}",
    'label="Google Maps Embed URL"': "label={t('admin.settings.system.maps_url')}",
    '>\n                                            Preview:\n                                        </p>': ">\n                                            {t('admin.settings.system.maps_preview')}\n                                        </p>",

    'title="Google reCAPTCHA"': "title={t('admin.settings.system.recaptcha_title')}",
    'label="Site Key"': "label={t('admin.settings.system.recaptcha_site')}",
    'label="Secret Key"': "label={t('admin.settings.system.recaptcha_secret')}",

    'title="Google Login"': "title={t('admin.settings.system.google_login')}",
    'label="Google OAuth Client ID"': "label={t('admin.settings.system.google_client_id')}",
    '>\n                                        OAuth Client ID tipe Web Application dari Google Cloud Console.\n                                    </p>': ">\n                                        {t('admin.settings.system.google_client_id_hint')}\n                                    </p>",
    'label="Google OAuth Client Secret"': "label={t('admin.settings.system.google_client_secret')}",
    '>\n                                        Client Secret dari Google Cloud Console. Jangan bagikan ke siapapun.\n                                    </p>': ">\n                                        {t('admin.settings.system.google_client_secret_hint')}\n                                    </p>",

    'title="Legal & Kebijakan"': "title={t('admin.settings.legal.title')}",
    'label="Judul Halaman Privasi"': "label={t('admin.settings.legal.privacy_title')}",
    'placeholder="Kebijakan Privasi Karivia"': "placeholder={t('admin.settings.legal.privacy_placeholder')}",
    'label="Judul Halaman Syarat & Ketentuan"': "label={t('admin.settings.legal.terms_title')}",
    'placeholder="Syarat & Ketentuan Penggunaan"': "placeholder={t('admin.settings.legal.terms_placeholder')}",
};

settingsContent = replaceAll(settingsContent, settingsReplacements);

// Sub components that need hook: AiApiKeyInput, ImageUpload
settingsContent = settingsContent.replace('function AiApiKeyInput({', 'function AiApiKeyInput({\n    const { t } = useTranslate();');
settingsContent = settingsContent.replace("'Sembunyikan API key'", "t('admin.settings.input.hide_api_key')");
settingsContent = settingsContent.replace("'Tampilkan API key'", "t('admin.settings.input.show_api_key')");

settingsContent = settingsContent.replace('function ImageUpload({', 'function ImageUpload({\n    const { t } = useTranslate();');
settingsContent = settingsContent.replace(
    '>\n                            Klik atau drag & drop gambar\n                        </p>',
    '>\n                            {t(\'admin.settings.image_upload.drag_drop\')}\n                        </p>'
);
settingsContent = settingsContent.replace(
    '>PNG, JPG, WEBP</p>',
    '>{t(\'admin.settings.image_upload.formats\')}</p>'
);

fs.writeFileSync(settingsPath, settingsContent, 'utf8');

// WhatsApp
const waPath = '/Applications/laravel/jobportal/resources/js/pages/admin/whatsapp.tsx';
let waContent = fs.readFileSync(waPath, 'utf8');

const waReplacements = {
    'export default function AdminWhatsApp({': "export default function AdminWhatsApp({\n    const { t } = useTranslate();",
    'title="WhatsApp Admin"': "title={t('admin.whatsapp.title')}",
    'description="Kelola sesi WhatsApp default untuk notifikasi sistem — termasuk notifikasi lupa password."': "description={t('admin.whatsapp.subtitle')}",
    '>\n                                    Gateway WhatsApp belum dikonfigurasi.\n                                </p>': ">\n                                    {t('admin.whatsapp.gateway_not_configured')}\n                                </p>",
    '>\n                                    Isi konfigurasi gateway di Pengaturan Web\n                                    (tab AI) untuk{\' \'}\n                                    <code className="rounded bg-red-100 px-1 text-xs">\n                                        whatsapp_gateway_url\n                                    </code>{\' \'}\n                                    dan{\' \'}\n                                    <code className="rounded bg-red-100 px-1 text-xs">\n                                        whatsapp_gateway_api_key\n                                    </code>\n                                    .\n                                </p>': ">\n                                    {t('admin.whatsapp.gateway_not_configured_hint_1')}\n                                    <code className=\"rounded bg-red-100 px-1 text-xs\">\n                                        whatsapp_gateway_url\n                                    </code>\n                                    {t('admin.whatsapp.gateway_not_configured_hint_2')}\n                                    <code className=\"rounded bg-red-100 px-1 text-xs\">\n                                        whatsapp_gateway_api_key\n                                    </code>\n                                    .\n                                </p>",
    '>\n                                Notifikasi Lupa Password via WhatsApp\n                            </p>': ">\n                                {t('admin.whatsapp.forgot_password_title')}\n                            </p>",
    '>\n                                Sesi ini digunakan sebagai gateway default untuk\n                                mengirimkan link reset password ke nomor\n                                WhatsApp yang diisi pengguna di halaman lupa\n                                password.\n                            </p>': ">\n                                {t('admin.whatsapp.forgot_password_desc')}\n                            </p>",
    '<CardTitle>Test & Info Sesi</CardTitle>': "<CardTitle>{t('admin.whatsapp.test_info_title')}</CardTitle>",
    '<CardDescription>\n                                Kirim pesan test ke nomor tertentu menggunakan\n                                sesi default ini.\n                            </CardDescription>': "<CardDescription>\n                                {t('admin.whatsapp.test_info_desc')}\n                            </CardDescription>",
    '>\n                                    Session ID Default\n                                </Label>': ">\n                                    {t('admin.whatsapp.session_id_label')}\n                                </Label>",
    'placeholder="Belum ada sesi terhubung"': "placeholder={t('admin.whatsapp.no_session_placeholder')}",
    '>\n                                    Session ID ini diambil dari pengaturan{\' \'}\n                                    <code className="rounded bg-muted px-1 text-xs">\n                                        whatsapp_gateway_default_session_id\n                                    </code>\n                                    . Membuat sesi baru di bawah akan\n                                    memperbarui nilai ini secara otomatis.\n                                </p>': ">\n                                    {t('admin.whatsapp.session_id_hint_1')}\n                                    <code className=\"rounded bg-muted px-1 text-xs\">\n                                        whatsapp_gateway_default_session_id\n                                    </code>\n                                    {t('admin.whatsapp.session_id_hint_2')}\n                                </p>",
    '>\n                                    Nomor uji koneksi\n                                </Label>': ">\n                                    {t('admin.whatsapp.test_phone_label')}\n                                </Label>",
    'placeholder="Contoh: 628123456789"': "placeholder={t('admin.whatsapp.test_phone_placeholder')}",
    '>\n                                    Isi nomor WhatsApp yang ingin menerima pesan\n                                    test dari sesi ini.\n                                </p>': ">\n                                    {t('admin.whatsapp.test_phone_hint')}\n                                </p>",
    '\n                                Test Kirim Pesan\n                            </Button>': "\n                                {t('admin.whatsapp.test_send_btn')}\n                            </Button>",

    '<CardTitle>Status sesi gateway</CardTitle>': "<CardTitle>{t('admin.whatsapp.status_title')}</CardTitle>",
    '<CardDescription>\n                                Buat sesi baru, reconnect, atau putuskan sesi\n                                default.\n                            </CardDescription>': "<CardDescription>\n                                {t('admin.whatsapp.status_desc')}\n                            </CardDescription>",
    '>\n                                        <QrCode className="size-4" />\n                                        Scan QR untuk menyambungkan perangkat\n                                    </p>': ">\n                                        <QrCode className=\"size-4\" />\n                                        {t('admin.whatsapp.scan_qr_title')}\n                                    </p>",
    '>\n                                        Jika WhatsApp menolak tautan perangkat,\n                                        tunggu QR diperbarui lalu scan ulang.\n                                    </p>': ">\n                                        {t('admin.whatsapp.scan_qr_desc')}\n                                    </p>",
    '>\n                                        Status saat ini\n                                    </p>': ">\n                                        {t('admin.whatsapp.current_status')}\n                                    </p>",
    '>\n                                        Label sesi\n                                    </Label>': ">\n                                        {t('admin.whatsapp.session_label')}\n                                    </Label>",
    'placeholder="Contoh: Admin Karivia"': "placeholder={t('admin.whatsapp.session_label_placeholder')}",
    '>\n                                    Setelah klik tombol di bawah, scan QR dari\n                                    WhatsApp di ponsel. Session ID default akan\n                                    diperbarui otomatis.\n                                </p>': ">\n                                    {t('admin.whatsapp.session_label_hint')}\n                                </p>",
    '\n                                    Buat / Hubungkan Sesi Baru\n                                </Button>': "\n                                    {t('admin.whatsapp.connect_btn')}\n                                </Button>",
    '\n                                    Reconnect\n                                </Button>': "\n                                    {t('admin.whatsapp.reconnect_btn')}\n                                </Button>",
    '\n                                    Putuskan Sesi\n                                </Button>': "\n                                    {t('admin.whatsapp.disconnect_btn')}\n                                </Button>",
    '>\n                                    Session aktif di nomor{\' \'}\n                                    {session.phone_number}.\n                                </p>': ">\n                                    {t('admin.whatsapp.session_active')}\n                                    {session.phone_number}.\n                                </p>",
};

waContent = replaceAll(waContent, waReplacements);

// Inject hook into stateBadge function
waContent = waContent.replace('function stateBadge(state?: string | null) {', 'function stateBadge(state?: string | null, t?: any) {');
waContent = waContent.replace('\n                Terhubung\n            </Badge>', '\n                {t(\'admin.whatsapp.badge.connected\')}\n            </Badge>');
waContent = waContent.replace('\n                Menunggu Scan\n            </Badge>', '\n                {t(\'admin.whatsapp.badge.waiting_qr\')}\n            </Badge>');
waContent = waContent.replace('\n                Belum ada sesi\n            </Badge>', '\n                {t(\'admin.whatsapp.badge.no_session\')}\n            </Badge>');

// Update stateBadge call
waContent = waContent.replace('{stateBadge(session?.state)}', '{stateBadge(session?.state, t)}');

fs.writeFileSync(waPath, waContent, 'utf8');

console.log('Settings and WA done');
