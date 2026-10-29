<?php
session_start();

if (!isset($_SESSION["uzytkownik_id"])) {
    header("Location: logowanie.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil użytkownika - HueMatch</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <main class="formularz-konto">
        <form action="wyloguj.php" method="POST">
            <button type="submit" class="przycisk przycisk--glowny">
                Wyloguj się
            </button>
        </form>
        <a href="index.html" class="powrot-glowna">
            ← Powrót do strony głównej
        </a>
    </main>

</body>
</html>
