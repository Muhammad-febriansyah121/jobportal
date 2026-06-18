<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 36px 42px 40px 42px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "DejaVu Serif", "Times New Roman", serif;
            font-size: 11px;
            line-height: 1.45;
            color: #1a1a1a;
        }

        .header {
            width: 100%;
        }

        .header td {
            vertical-align: top;
        }

        .header .info {
            width: 75%;
            padding-right: 12px;
        }

        .header .photo-cell {
            width: 25%;
            text-align: right;
        }

        .name {
            font-size: 18px;
            font-weight: bold;
            color: #1f3c88;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }

        .subline {
            font-size: 11px;
            color: #222;
            margin-bottom: 1px;
        }

        .contact {
            font-size: 10.5px;
            color: #222;
            margin-top: 4px;
        }

        .contact .row {
            margin-bottom: 2px;
        }

        .contact .ico {
            display: inline-block;
            width: 11px;
            height: 11px;
            vertical-align: -1px;
            margin-right: 4px;
        }

        .photo {
            width: 96px;
            height: 120px;
            border: 2px solid #c9c9c9;
            object-fit: cover;
        }

        .section {
            margin-top: 14px;
        }

        h2.section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1f3c88;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-bottom: 1.5px solid #1a1a1a;
            padding-bottom: 3px;
            margin-bottom: 6px;
        }

        p.para {
            text-align: justify;
            margin-bottom: 6px;
        }

        .entry-title {
            font-weight: bold;
            font-size: 11px;
        }

        .entry-sub {
            font-size: 10.5px;
        }

        .entry-meta {
            font-size: 10.5px;
            color: #333;
        }

        ul {
            margin: 2px 0 6px 18px;
        }

        li {
            margin-bottom: 2px;
            text-align: justify;
        }

        .block {
            margin-bottom: 8px;
        }

        .lang-row {
            margin-bottom: 2px;
        }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td class="info">
                <div class="name">{{ $name }}</div>
                @if ($birthLine)
                    <div class="subline">{{ $birthLine }}</div>
                @endif
                @if ($degreeTitle)
                    <div class="subline">{{ $degreeTitle }}</div>
                @endif

                <div class="contact">
                    @if ($city)
                        <div class="row"><img class="ico" src="{{ $icons['location'] }}" alt="">{{ $city }}</div>
                    @endif
                    @if ($phone)
                        <div class="row"><img class="ico" src="{{ $icons['phone'] }}" alt="">{{ $phone }}</div>
                    @endif
                    @if ($email)
                        <div class="row"><img class="ico" src="{{ $icons['email'] }}" alt="">{{ $email }}</div>
                    @endif
                    @foreach ($links as $link)
                        <div class="row"><img class="ico" src="{{ $icons['link'] }}" alt="">{{ $link }}</div>
                    @endforeach
                </div>
            </td>
            <td class="photo-cell">
                @if ($photo)
                    <img class="photo" src="{{ $photo }}" alt="">
                @endif
            </td>
        </tr>
    </table>

    @if ($summary)
        <div class="section">
            <h2 class="section-title">Profil Singkat</h2>
            <p class="para">{{ $summary }}</p>
        </div>
    @endif

    @if (count($educations))
        <div class="section">
            <h2 class="section-title">Pendidikan</h2>
            @foreach ($educations as $edu)
                <div class="block">
                    <div class="entry-title">{{ $edu['school'] }}</div>
                    @if ($edu['detail'])
                        <div class="entry-sub">{{ $edu['detail'] }}</div>
                    @endif
                    @if ($edu['period'])
                        <div class="entry-meta">{{ $edu['period'] }}</div>
                    @endif
                    @if (count($edu['bullets']))
                        <ul>
                            @foreach ($edu['bullets'] as $b)
                                <li>{{ $b }}</li>
                            @endforeach
                        </ul>
                    @endif
                </div>
            @endforeach
        </div>
    @endif

    @if (count($academic))
        <div class="section">
            <h2 class="section-title">Pengalaman Akademik &amp; Praktikum</h2>
            <ul>
                @foreach ($academic as $item)
                    <li>{{ $item }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @if (count($experiences))
        <div class="section">
            <h2 class="section-title">Pengalaman Kerja</h2>
            @foreach ($experiences as $exp)
                <div class="block">
                    @if ($exp['company'])
                        <div class="entry-title">{{ $exp['company'] }}</div>
                    @endif
                    @if ($exp['period'])
                        <div class="entry-meta">{{ $exp['period'] }}</div>
                    @endif
                    @if ($exp['role'])
                        <div class="entry-sub">{{ $exp['role'] }}</div>
                    @endif
                    @if ($exp['paragraph'])
                        <p class="para">{{ $exp['paragraph'] }}</p>
                    @endif
                    @if (count($exp['bullets']))
                        <ul>
                            @foreach ($exp['bullets'] as $b)
                                <li>{{ $b }}</li>
                            @endforeach
                        </ul>
                    @endif
                </div>
            @endforeach
        </div>
    @endif

    @if (count($skills))
        <div class="section">
            <h2 class="section-title">Kemampuan</h2>
            <ul>
                @foreach ($skills as $skill)
                    <li>{{ $skill }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @if (count($certifications))
        <div class="section">
            <h2 class="section-title">Sertifikat / Seminar</h2>
            <ul>
                @foreach ($certifications as $cert)
                    <li>{{ $cert }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @if (count($languages))
        <div class="section">
            <h2 class="section-title">Bahasa</h2>
            <ul>
                @foreach ($languages as $lang)
                    <li>{{ $lang }}</li>
                @endforeach
            </ul>
        </div>
    @endif
</body>
</html>
