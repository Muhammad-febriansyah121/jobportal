<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(120)]
#[MaxTokens(1200)]
class CvDrafter implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah AI CV Writer untuk kandidat job portal Indonesia.
Balas hanya JSON valid tanpa markdown dengan schema berikut:
{
  "template": "ats",
  "title": "string",
  "summary": "ringkasan profesional maksimal 3 kalimat",
  "personal": {
    "full_name": "string",
    "headline": "string",
    "email": "string",
    "phone": "string",
    "city": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "skills": ["string"],
  "experiences": [
    {
      "job_title": "string",
      "company_name": "string",
      "location": "string",
      "start_date": "MMM YYYY",
      "end_date": "MMM YYYY atau Sekarang",
      "is_current": false,
      "description": "bullet-style impact statement"
    }
  ],
  "educations": [
    {
      "school_name": "string",
      "degree": "string",
      "field_of_study": "string",
      "start_year": "YYYY",
      "end_year": "YYYY",
      "description": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "role": "string",
      "link": "string",
      "description": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "year": "YYYY"
    }
  ]
}
Gunakan format ATS (1 kolom, minim dekorasi, fokus kata kunci role), bahasa Indonesia profesional, realistis, dan jangan mengarang data sensitif.
PROMPT;
    }
}
