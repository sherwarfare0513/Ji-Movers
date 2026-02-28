<?php
declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '{}', true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

$name = trim((string)($payload['full_name'] ?? ''));
$phone = trim((string)($payload['phone'] ?? ''));
$email = trim((string)($payload['email'] ?? ''));
$moveType = trim((string)($payload['move_type'] ?? ''));
$fromLocation = trim((string)($payload['from_location'] ?? ''));
$toLocation = trim((string)($payload['to_location'] ?? ''));

if ($name === '' || $phone === '' || $email === '' || $moveType === '' || $fromLocation === '' || $toLocation === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

// Configure these values on your hosting/server:
// WHATSAPP_TOKEN: Permanent access token from Meta WhatsApp Cloud API
// WHATSAPP_PHONE_NUMBER_ID: WhatsApp business phone number ID
// WHATSAPP_TO_NUMBER: Destination number in international format, e.g. 971522013220
$token = getenv('WHATSAPP_TOKEN') ?: '';
$phoneNumberId = getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '';
$toNumber = getenv('WHATSAPP_TO_NUMBER') ?: '';

if ($token === '' || $phoneNumberId === '' || $toNumber === '') {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'WhatsApp API is not configured. Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TO_NUMBER.'
    ]);
    exit;
}

$message =
    "New Enquiry\n" .
    "Name: {$name}\n" .
    "Phone: {$phone}\n" .
    "Email: {$email}\n" .
    "Move Type: {$moveType}\n" .
    "From: {$fromLocation}\n" .
    "To: {$toLocation}";

$graphUrl = "https://graph.facebook.com/v21.0/{$phoneNumberId}/messages";
$body = json_encode([
    'messaging_product' => 'whatsapp',
    'to' => $toNumber,
    'type' => 'text',
    'text' => [
        'preview_url' => false,
        'body' => $message,
    ],
], JSON_UNESCAPED_UNICODE);

$ch = curl_init($graphUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $curlError !== '') {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'Failed to contact WhatsApp API']);
    exit;
}

if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => 'WhatsApp API rejected the request',
        'details' => json_decode($response, true),
    ]);
    exit;
}

echo json_encode(['ok' => true]);
