<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

echo json_encode([
    "zalogowany" => isset($_SESSION["uzytkownik_id"]),
    "nazwa" => $_SESSION["nazwa_uzytkownika"] ?? null
], JSON_UNESCAPED_UNICODE);
