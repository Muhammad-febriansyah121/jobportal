<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegionController extends Controller
{
    /** @return array<int, string> */
    private static function provinceList(): array
    {
        return [
            'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau',
            'Jambi', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung',
            'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta',
            'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
            'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
            'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat',
            'Sulawesi Selatan', 'Sulawesi Tenggara',
            'Maluku', 'Maluku Utara',
            'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya',
        ];
    }

    /** @return array<string, array<int, string>> */
    private static function cityMap(): array
    {
        return [
            'Aceh' => ['Banda Aceh', 'Sabang', 'Lhokseumawe', 'Langsa', 'Subulussalam', 'Aceh Besar', 'Pidie', 'Aceh Utara', 'Aceh Timur', 'Aceh Barat'],
            'Sumatera Utara' => ['Medan', 'Binjai', 'Pematangsiantar', 'Tebing Tinggi', 'Tanjungbalai', 'Sibolga', 'Padangsidimpuan', 'Gunungsitoli', 'Deli Serdang', 'Langkat', 'Serdang Bedagai', 'Karo', 'Simalungun', 'Asahan', 'Batubara', 'Labuhanbatu', 'Tapanuli Selatan', 'Tapanuli Tengah', 'Tapanuli Utara', 'Toba'],
            'Sumatera Barat' => ['Padang', 'Bukittinggi', 'Payakumbuh', 'Padangpanjang', 'Sawahlunto', 'Solok', 'Pariaman', 'Agam', 'Pasaman', 'Tanah Datar', 'Solok Selatan', 'Dharmasraya', 'Sijunjung'],
            'Riau' => ['Pekanbaru', 'Dumai', 'Kampar', 'Bengkalis', 'Rokan Hilir', 'Indragiri Hulu', 'Indragiri Hilir', 'Siak', 'Pelalawan', 'Kuantan Singingi'],
            'Kepulauan Riau' => ['Batam', 'Tanjungpinang', 'Bintan', 'Karimun', 'Natuna', 'Kepulauan Anambas', 'Lingga'],
            'Jambi' => ['Jambi', 'Sungai Penuh', 'Batanghari', 'Muaro Jambi', 'Tanjung Jabung Timur', 'Tanjung Jabung Barat', 'Bungo', 'Tebo', 'Sarolangun', 'Merangin'],
            'Sumatera Selatan' => ['Palembang', 'Prabumulih', 'Pagar Alam', 'Lubuklinggau', 'Ogan Komering Ulu', 'Ogan Komering Ilir', 'Muara Enim', 'Lahat', 'Musi Rawas', 'Musi Banyuasin', 'Banyuasin', 'Empat Lawang'],
            'Kepulauan Bangka Belitung' => ['Pangkalpinang', 'Bangka', 'Belitung', 'Bangka Barat', 'Bangka Tengah', 'Bangka Selatan', 'Belitung Timur'],
            'Bengkulu' => ['Bengkulu', 'Rejang Lebong', 'Bengkulu Utara', 'Bengkulu Selatan', 'Kaur', 'Seluma', 'Muko-Muko', 'Lebong', 'Kepahiang'],
            'Lampung' => ['Bandar Lampung', 'Metro', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Utara', 'Lampung Barat', 'Tanggamus', 'Lampung Timur', 'Way Kanan', 'Tulangbawang', 'Pesawaran', 'Mesuji', 'Tulang Bawang Barat', 'Pringsewu', 'Pesisir Barat'],
            'DKI Jakarta' => ['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Kepulauan Seribu'],
            'Jawa Barat' => ['Bandung', 'Bogor', 'Bekasi', 'Depok', 'Cimahi', 'Cirebon', 'Sukabumi', 'Tasikmalaya', 'Banjar', 'Garut', 'Cianjur', 'Subang', 'Purwakarta', 'Karawang', 'Majalengka', 'Sumedang', 'Kuningan', 'Indramayu', 'Ciamis', 'Pangandaran'],
            'Banten' => ['Serang', 'Cilegon', 'Tangerang', 'Tangerang Selatan', 'Lebak', 'Pandeglang'],
            'Jawa Tengah' => ['Semarang', 'Solo', 'Magelang', 'Salatiga', 'Pekalongan', 'Tegal', 'Boyolali', 'Klaten', 'Sukoharjo', 'Wonogiri', 'Karanganyar', 'Sragen', 'Grobogan', 'Blora', 'Rembang', 'Pati', 'Kudus', 'Jepara', 'Demak', 'Semarang Kab', 'Kendal', 'Batang', 'Pekalongan Kab', 'Pemalang', 'Tegal Kab', 'Brebes', 'Purbalingga', 'Banjarnegara', 'Kebumen', 'Purworejo', 'Wonosobo', 'Magelang Kab', 'Temanggung', 'Cilacap', 'Banyumas'],
            'DI Yogyakarta' => ['Yogyakarta', 'Sleman', 'Bantul', 'Kulonprogo', 'Gunungkidul'],
            'Jawa Timur' => ['Surabaya', 'Malang', 'Blitar', 'Kediri', 'Mojokerto', 'Madiun', 'Probolinggo', 'Pasuruan', 'Batu', 'Gresik', 'Sidoarjo', 'Jombang', 'Lamongan', 'Bojonegoro', 'Tuban', 'Ngawi', 'Ponorogo', 'Magetan', 'Nganjuk', 'Trenggalek', 'Tulungagung', 'Blitar Kab', 'Kediri Kab', 'Jember', 'Banyuwangi', 'Situbondo', 'Bondowoso', 'Lumajang', 'Probolinggo Kab', 'Pasuruan Kab', 'Mojokerto Kab', 'Sampang', 'Pamekasan', 'Sumenep', 'Bangkalan'],
            'Bali' => ['Denpasar', 'Badung', 'Gianyar', 'Tabanan', 'Jembrana', 'Buleleng', 'Klungkung', 'Bangli', 'Karangasem'],
            'Nusa Tenggara Barat' => ['Mataram', 'Bima', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur', 'Lombok Utara', 'Sumbawa', 'Sumbawa Barat', 'Dompu', 'Bima Kab'],
            'Nusa Tenggara Timur' => ['Kupang', 'Flores Timur', 'Sikka', 'Ende', 'Ngada', 'Manggarai', 'Manggarai Barat', 'Manggarai Timur', 'Sumba Timur', 'Sumba Barat', 'Timor Tengah Selatan', 'Timor Tengah Utara', 'Belu', 'Alor'],
            'Kalimantan Barat' => ['Pontianak', 'Singkawang', 'Mempawah', 'Sambas', 'Bengkayang', 'Landak', 'Kubu Raya', 'Sanggau', 'Sekadau', 'Melawi', 'Sintang', 'Kapuas Hulu', 'Ketapang', 'Kayong Utara'],
            'Kalimantan Tengah' => ['Palangka Raya', 'Kotawaringin Barat', 'Kotawaringin Timur', 'Kapuas', 'Barito Selatan', 'Barito Utara', 'Barito Timur', 'Murung Raya', 'Katingan', 'Seruyan', 'Lamandau', 'Sukamara', 'Pulang Pisau', 'Gunung Mas'],
            'Kalimantan Selatan' => ['Banjarmasin', 'Banjarbaru', 'Banjar', 'Tanah Laut', 'Tanah Bumbu', 'Kotabaru', 'Hulu Sungai Selatan', 'Hulu Sungai Tengah', 'Hulu Sungai Utara', 'Tabalong', 'Balangan', 'Tapin', 'Barito Kuala'],
            'Kalimantan Timur' => ['Samarinda', 'Balikpapan', 'Bontang', 'Kutai Kartanegara', 'Kutai Barat', 'Kutai Timur', 'Berau', 'Paser', 'Penajam Paser Utara', 'Mahakam Ulu'],
            'Kalimantan Utara' => ['Tarakan', 'Bulungan', 'Malinau', 'Nunukan', 'Tana Tidung'],
            'Sulawesi Utara' => ['Manado', 'Bitung', 'Tomohon', 'Kotamobagu', 'Minahasa', 'Minahasa Utara', 'Minahasa Selatan', 'Minahasa Tenggara', 'Kepulauan Sangihe', 'Kepulauan Talaud', 'Bolaang Mongondow', 'Bolaang Mongondow Utara', 'Bolaang Mongondow Selatan', 'Bolaang Mongondow Timur'],
            'Gorontalo' => ['Gorontalo', 'Gorontalo Utara', 'Gorontalo Kab', 'Bone Bolango', 'Boalemo', 'Pohuwato'],
            'Sulawesi Tengah' => ['Palu', 'Donggala', 'Sigi', 'Parigi Moutong', 'Poso', 'Tojo Una-Una', 'Morowali', 'Morowali Utara', 'Banggai', 'Banggai Laut', 'Banggai Kepulauan', 'Toli-Toli', 'Buol'],
            'Sulawesi Barat' => ['Mamuju', 'Polewali Mandar', 'Mamasa', 'Majene', 'Mamuju Tengah', 'Pasangkayu'],
            'Sulawesi Selatan' => ['Makassar', 'Palopo', 'Parepare', 'Gowa', 'Takalar', 'Jeneponto', 'Bantaeng', 'Bulukumba', 'Selayar', 'Sinjai', 'Bone', 'Soppeng', 'Wajo', 'Sidrap', 'Pinrang', 'Enrekang', 'Tana Toraja', 'Toraja Utara', 'Luwu', 'Luwu Utara', 'Luwu Timur', 'Pangkajene Kepulauan', 'Barru', 'Maros', 'Kepulauan Selayar'],
            'Sulawesi Tenggara' => ['Kendari', 'Bau-Bau', 'Konawe', 'Konawe Selatan', 'Konawe Utara', 'Konawe Kepulauan', 'Kolaka', 'Kolaka Utara', 'Kolaka Timur', 'Bombana', 'Muna', 'Muna Barat', 'Buton', 'Buton Utara', 'Buton Tengah', 'Buton Selatan', 'Wakatobi'],
            'Maluku' => ['Ambon', 'Tual', 'Maluku Tengah', 'Seram Bagian Barat', 'Seram Bagian Timur', 'Maluku Tenggara', 'Maluku Tenggara Barat', 'Kepulauan Aru', 'Buru', 'Buru Selatan'],
            'Maluku Utara' => ['Ternate', 'Tidore Kepulauan', 'Halmahera Barat', 'Halmahera Tengah', 'Halmahera Utara', 'Halmahera Selatan', 'Halmahera Timur', 'Kepulauan Sula', 'Pulau Morotai', 'Pulau Taliabu'],
            'Papua' => ['Jayapura', 'Jayapura Kab', 'Keerom', 'Sarmi', 'Biak Numfor', 'Kepulauan Yapen', 'Waropen', 'Mamberamo Raya', 'Mamberamo Tengah', 'Yalimo', 'Tolikara', 'Nabire'],
            'Papua Barat' => ['Manokwari', 'Sorong', 'Sorong Selatan', 'Raja Ampat', 'Manokwari Selatan', 'Pegunungan Arfak', 'Tambrauw', 'Maybrat', 'Kaimana', 'Teluk Bintuni', 'Teluk Wondama', 'Fak-Fak'],
            'Papua Selatan' => ['Merauke', 'Boven Digoel', 'Mappi', 'Asmat'],
            'Papua Tengah' => ['Nabire', 'Paniai', 'Puncak Jaya', 'Puncak', 'Intan Jaya', 'Deiyai', 'Dogiyai'],
            'Papua Pegunungan' => ['Jayawijaya', 'Pegunungan Bintang', 'Yahukimo', 'Tolikara', 'Nduga', 'Lanny Jaya', 'Mamberamo Tengah', 'Yalimo'],
            'Papua Barat Daya' => ['Sorong', 'Sorong Selatan', 'Raja Ampat', 'Tambrauw', 'Maybrat'],
        ];
    }

    public function provinces(): JsonResponse
    {
        return response()->json(self::provinceList());
    }

    public function cities(Request $request): JsonResponse
    {
        $province = $request->string('province')->toString();
        $cities = self::cityMap();

        if ($province && isset($cities[$province])) {
            return response()->json($cities[$province]);
        }

        // Return all cities flat if no province specified
        $all = [];
        foreach ($cities as $citiesList) {
            foreach ($citiesList as $city) {
                $all[] = $city;
            }
        }
        sort($all);

        return response()->json(array_values(array_unique($all)));
    }
}
