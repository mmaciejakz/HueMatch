<?php
$polaczenie = mysqli_connect(
    "localhost",
    "root",
    "",
    "huematch"
);

if (!$polaczenie) {
    die("Błąd połączenia z bazą danych!");
}

mysqli_set_charset($polaczenie, "utf8mb4");
?>
