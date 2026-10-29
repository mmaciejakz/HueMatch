<?php
session_start();
require_once "db.php";

$komunikat = "";
$bledne_pola = [];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nazwa = trim($_POST["nazwa"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $haslo = $_POST["haslo"] ?? "";
    $powtorz_haslo = $_POST["powtorz_haslo"] ?? "";

    if ($nazwa === "" || $email === "" || $haslo === "" || $powtorz_haslo === "") {
        $komunikat = "Wypełnij wszystkie pola.";

        if ($nazwa === "") {
            $bledne_pola[] = "nazwa";
        }
        if ($email === "") {
            $bledne_pola[] = "email";
        }
        if ($haslo === "") {
            $bledne_pola[] = "haslo";
        }
        if ($powtorz_haslo === "") {
            $bledne_pola[] = "powtorz_haslo";
        }
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $komunikat = "Podaj poprawny adres e-mail.";
        $bledne_pola[] = "email";
    } elseif (strlen($haslo) < 8) {
        $komunikat = "Hasło musi mieć co najmniej 8 znaków.";
        $bledne_pola[] = "haslo";
    } elseif ($haslo !== $powtorz_haslo) {
        $komunikat = "Hasła nie są takie same.";
        $bledne_pola[] = "haslo";
        $bledne_pola[] = "powtorz_haslo";
    } else {
        // Sprawdzenie, czy nazwa użytkownika lub e-mail są już zajęte
        $zapytanie = mysqli_prepare(
            $polaczenie,
            "SELECT username, email FROM users
             WHERE email = ? OR username = ?"
        );

        if ($zapytanie) {
            mysqli_stmt_bind_param($zapytanie, "ss", $email, $nazwa);
            mysqli_stmt_execute($zapytanie);
            mysqli_stmt_store_result($zapytanie);

            if (mysqli_stmt_num_rows($zapytanie) > 0) {
                mysqli_stmt_bind_result(
                    $zapytanie,
                    $istniejaca_nazwa,
                    $istniejacy_email
                );

                while (mysqli_stmt_fetch($zapytanie)) {
                    if ($istniejacy_email === $email) {
                        $komunikat = "Ten adres e-mail jest już zajęty.";
                        $bledne_pola[] = "email";
                        break;
                    }

                    if ($istniejaca_nazwa === $nazwa) {
                        $komunikat = "Ta nazwa użytkownika jest już zajęta.";
                        $bledne_pola[] = "nazwa";
                        break;
                    }
                }

                mysqli_stmt_close($zapytanie);
            } else {
                mysqli_stmt_close($zapytanie);

                // Zabezpieczenie hasła przed zapisaniem do bazy
                $skrot_hasla = password_hash($haslo, PASSWORD_DEFAULT);

                $zapytanie = mysqli_prepare(
                    $polaczenie,
                    "INSERT INTO users (username, email, password_hash)
                     VALUES (?, ?, ?)"
                );

                if ($zapytanie) {
                    mysqli_stmt_bind_param(
                        $zapytanie,
                        "sss",
                        $nazwa,
                        $email,
                        $skrot_hasla
                    );

                    if (mysqli_stmt_execute($zapytanie)) {
                        mysqli_stmt_close($zapytanie);

                        header("Location: logowanie.php?rejestracja=udana");
                        exit;
                    } else {
                        $komunikat = "Nie udało się utworzyć konta.";
                        mysqli_stmt_close($zapytanie);
                    }
                } else {
                    $komunikat = "Wystąpił błąd. Spróbuj ponownie później.";
                }
            }
        } else {
            $komunikat = "Wystąpił błąd. Spróbuj ponownie później.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rejestracja - HueMatch</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="formularz-konto">
        <h1>Dołącz do HueMatch</h1>
        <p>Utwórz swoje konto.</p>

        <?php if ($komunikat !== ""): ?>
            <p class="komunikat-konta blad">
                <?= htmlspecialchars($komunikat, ENT_QUOTES, "UTF-8") ?>
            </p>
        <?php endif; ?>

        <form method="POST" action="rejestracja.php">
            <div class="pole">
                <label for="nazwa">Nazwa użytkownika</label>
                <input
                    type="text"
                    id="nazwa"
                    name="nazwa"
                    maxlength="50"
                    required
                    class="<?= in_array('nazwa', $bledne_pola, true) ? 'pole-blad' : '' ?>"
                    value="<?= htmlspecialchars($_POST["nazwa"] ?? "", ENT_QUOTES, "UTF-8") ?>"
                >
            </div>

            <br>

            <div class="pole">
                <label for="email">E-mail</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    maxlength="100"
                    required
                    class="<?= in_array('email', $bledne_pola, true) ? 'pole-blad' : '' ?>"
                    value="<?= htmlspecialchars($_POST["email"] ?? "", ENT_QUOTES, "UTF-8") ?>"
                >
            </div>

            <br>

            <div class="pole">
                <label for="haslo">Hasło</label>
                <input
                    type="password"
                    id="haslo"
                    name="haslo"
                    minlength="8"
                    required
                    class="<?= in_array('haslo', $bledne_pola, true) ? 'pole-blad' : '' ?>"
                >
                <span class="pole_podpowiedz">
                    Hasło musi mieć co najmniej 8 znaków.
                </span>
            </div>

            <br>

            <div class="pole">
                <label for="powtorz_haslo">Powtórz hasło</label>
                <input
                    type="password"
                    id="powtorz_haslo"
                    name="powtorz_haslo"
                    minlength="8"
                    required
                    class="<?= in_array('powtorz_haslo', $bledne_pola, true) ? 'pole-blad' : '' ?>"
                >
            </div>

            <br>

            <button type="submit" class="przycisk przycisk--glowny">
                Zarejestruj się
            </button>
        </form>

        <p>Masz już konto? <a href="logowanie.php">Zaloguj się</a></p>

        <a href="index.html" class="powrot-glowna">
            ← Powrót do strony głównej
        </a>
    </main>
</body>
</html>
