
<?php
session_start();
require_once "db.php";

$komunikat = "";
$rodzaj_komunikatu = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = trim($_POST["email"] ?? "");
    $haslo = $_POST["haslo"] ?? "";

    $zapytanie = mysqli_prepare(
        $polaczenie,
        "SELECT id, username, password_hash
         FROM users
         WHERE email = ?"
    );

    if ($zapytanie) {
        mysqli_stmt_bind_param($zapytanie, "s", $email);
        mysqli_stmt_execute($zapytanie);

        mysqli_stmt_bind_result(
            $zapytanie,
            $id,
            $nazwa,
            $skrot_hasla
        );

        if (mysqli_stmt_fetch($zapytanie)) {
            if (password_verify($haslo, $skrot_hasla)) {
                mysqli_stmt_close($zapytanie);

                session_regenerate_id(true);
                $_SESSION["uzytkownik_id"] = $id;
                $_SESSION["nazwa_uzytkownika"] = $nazwa;

                header("Location: index.html");
                exit;
            } else {
                $komunikat = "Nieprawidłowe hasło.";
                $rodzaj_komunikatu = "blad";
            }
        } else {
            $komunikat = "Nie ma konta o takim adresie e-mail.";
            $rodzaj_komunikatu = "blad";
        }

        mysqli_stmt_close($zapytanie);
    } else {
        $komunikat = "Wystąpił błąd. Spróbuj ponownie później.";
        $rodzaj_komunikatu = "blad";
    }
}
?>

<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logowanie - HueMatch</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="formularz-konto">

        <h1>Witaj ponownie!</h1>
        <p>Zaloguj się do HueMatch.</p>
        <?php if (($_GET["rejestracja"] ?? "") === "udana"): ?>
            <p class="komunikat-konta sukces">
                Konto zostało utworzone! Możesz się teraz zalogować.
            </p>
        <?php endif; ?>
        <?php if ($komunikat !== ""): ?>
            <p class="komunikat-konta <?= htmlspecialchars($rodzaj_komunikatu, ENT_QUOTES, "UTF-8") ?>">
                <?= htmlspecialchars($komunikat, ENT_QUOTES, "UTF-8") ?>
            </p>
        <?php endif; ?>

        <form method="POST" action="logowanie.php">
            <div class="pole">
                <label for="email">E-mail</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    maxlength="100"
                    autocomplete="email"
                    value="<?= htmlspecialchars($_POST["email"] ?? "", ENT_QUOTES, "UTF-8") ?>"
                    class="<?= $rodzaj_komunikatu === "blad" ? "pole-blad" : "" ?>"
                    required
                >
            </div>

            <div class="pole">
                <label for="haslo">Hasło</label>
                <input
                    type="password"
                    id="haslo"
                    name="haslo"
                    autocomplete="current-password"
                    class="<?= $rodzaj_komunikatu === "blad" ? "pole-blad" : "" ?>"
                    required
                >
            </div>

            <button type="submit" class="przycisk przycisk--glowny">
                Zaloguj się
            </button>
        </form>

        <p>
            Nie masz konta?
            <a href="rejestracja.php">Zarejestruj się</a>
        </p>
        <a href="index.html" class="powrot-glowna">
            ← Powrót do strony głównej
        </a>
    </main>
</body>
</html>
