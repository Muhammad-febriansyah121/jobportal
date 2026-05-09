<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;

class PakasirService
{
    private const BASE_URL = 'https://app.pakasir.com/api';

    private string $project;

    private string $apiKey;

    public function __construct()
    {
        $this->project = Setting::get('pakasir_project', '');
        $this->apiKey = Setting::get('pakasir_api_key', '');
    }

    /**
     * Create a new transaction.
     *
     * @param  string  $method  qris|bni_va|bri_va|cimb_niaga_va|maybank_va|permata_va
     * @return array<string, mixed>
     */
    public function createTransaction(string $method, string $orderId, int $amount): array
    {
        $response = Http::post(self::BASE_URL."/transactioncreate/{$method}", [
            'project' => $this->project,
            'order_id' => $orderId,
            'amount' => $amount,
            'api_key' => $this->apiKey,
        ]);

        return $response->json();
    }

    /**
     * Get transaction detail / check payment status.
     *
     * @return array<string, mixed>
     */
    public function checkTransaction(string $orderId, int $amount): array
    {
        $response = Http::get(self::BASE_URL.'/transactiondetail', [
            'project' => $this->project,
            'order_id' => $orderId,
            'amount' => $amount,
            'api_key' => $this->apiKey,
        ]);

        return $response->json();
    }

    /**
     * Cancel a pending transaction.
     *
     * @return array<string, mixed>
     */
    public function cancelTransaction(string $orderId, int $amount): array
    {
        $response = Http::post(self::BASE_URL.'/transactioncancel', [
            'project' => $this->project,
            'order_id' => $orderId,
            'amount' => $amount,
            'api_key' => $this->apiKey,
        ]);

        return $response->json();
    }

    /**
     * Simulate a payment (sandbox only).
     *
     * @return array<string, mixed>
     */
    public function simulatePayment(string $orderId, int $amount): array
    {
        $response = Http::post(self::BASE_URL.'/paymentsimulation', [
            'project' => $this->project,
            'order_id' => $orderId,
            'amount' => $amount,
            'api_key' => $this->apiKey,
        ]);

        return $response->json();
    }

    /**
     * Generate a hosted payment page URL (no API call needed).
     */
    public function paymentUrl(int $amount, string $orderId): string
    {
        return 'https://app.pakasir.com/pay/'.$this->project.'/'.$amount.'?order_id='.urlencode($orderId);
    }
}
