HueMatch – dokumentacja script wyszukiwania
Opis działania skryptu wyszukiwania.
Skrót całości: użytkownik ustawia filtry → odczytajFiltryZFormularza() składa z nich obiekt filtry → uruchomAlgorytmWyszukiwania(filtry) generuje, ocenia i wybiera palety → funkcje utwórz…/wyrenderuj… rysują wynik na stronie.
Obiekt filtry (najważniejsza struktura danych)
Przechodzi przez cały algorytm. Tworzy go odczytajFiltryZFormularza():
• kolorReferencyjny – HEX koloru użytkownika (zawsze poprawny, wielkimi literami)
• kolorByłWylosowany – true, jeśli użytkownik nic nie podał i kolor wylosowaliśmy sami
• rozmiarPalety – liczba kolorów 2–5 (wraz z kolorem referencyjnym)
• cechy – tablica wybranych chipów: neon, professional, chaotic (może być pusta)
• nastroj – tablica wybranych chipów: clean, calm, energetic (może być pusta)
• temperatura – 'cool', 'neutral' lub 'warm'
• ciemnyMotyw, wysokiKontrast – wartości true/false z przełączników
Paleta w całym kodzie to tablica obiektów-kolorów { h, s, l, hex, referencyjny }. Pierwszy element to zawsze kolor użytkownika (referencyjny: true).

SEKCJA 1: Konwersje kolorów i funkcje pomocnicze
Algorytm pracuje w HSL: h = odcień (kąt na kole kolorów, 0–360°), s = nasycenie (0–100), l = jasność (0–100). Na odcieniu łatwo robić „obroty” (harmonie), a w HEX/RGB nie.
• hexNaRgb(hex) – "#3a7bd5" (lub skrócone "#3af") → {r,g,b} (0–255). Używa parseInt(…, 16) i przesunięć bitowych.
• rgbNaHex(r,g,b) – odwrotnie; każdą składową obcina do 0–255 i zapisuje dwuznakowo.
• rgbNaHsl(r,g,b) – standardowy wzór RGB→HSL; zwraca zaokrąglone {h,s,l}.
• hslNaRgb(h,s,l) – wzór odwrotny; h normalizuje do 0–360 (też dla wartości ujemnych).
• hexNaHsl(hex) – skrót: hexNaRgb + rgbNaHsl.
• hslNaHex(h,s,l) – skrót: hslNaRgb + rgbNaHex. Z niej korzysta generator kolorów.
• czyPoprawnyHex(tekst) – sprawdza wyrażeniem regularnym, czy tekst to 3 lub 6 znaków szesnastkowych (z # lub bez). Używa jej formularz.
• losowaLiczbaCalkowita(min,max) – losowa liczba całkowita włącznie z obiema granicami.
• sredniaZTablicy(liczby) – średnia arytmetyczna (pusta tablica → 0). Używana we wszystkich ocenach.
• odchylenieStandardowe(liczby) – miara rozrzutu wartości. Używana do oceny „chaotic” (nagradza zróżnicowanie).
• ogranicz(wartosc,min,max) – „przycina” liczbę do przedziału; służy do trzymania ocen w 0–100.

SEKCJA 2: Kontrast WCAG
• luminancjaWzgledna(hex) – jasność koloru „jak widzi ją oko” (0 = czerń, 1 = biel). Każdy kanał RGB jest linearyzowany (progi 0.03928, 12.92, 2.4 to stałe z normy WCAG), a potem ważony: 0,2126 R + 0,7152 G + 0,0722 B (oko najsilniej reaguje na zieleń).
• wspolczynnikKontrastu(hexA,hexB) – wzór (jaśniejsza + 0.05) / (ciemniejsza + 0.05). Wynik od 1 (identyczne) do 21 (czarny na białym). Używa go ocenKontrast.
• kolorTekstuDlaTla(hex) – zwraca nazwę klasy CSS: 'ciemna' (ciemny tekst), gdy luminancja tła > 0.42, w przeciwnym razie 'jasna' (jasny tekst). Dzięki temu etykiety HEX na kafelkach są zawsze czytelne. Używają jej funkcje rysujące karty.

SEKCJA 3: Temperatura barwy
Temperaturę oceniamy wyłącznie po odcieniu.
• STREFA_CIEPLA = {start:330, koniec:70} – ciepłe: czerwienie/pomarańcze/żółcie. Zakres „zawija się” przez 0°.
• STREFA_ZIMNA = {start:160, koniec:280} – zimne: cyjany/błękity/fiolety. Wszystko poza tymi dwiema strefami jest „neutralne”.
• czyOdcienWZakresie(h,start,koniec) – sprawdza, czy odcień mieści się w zakresie, także gdy zakres przechodzi przez 0°/360°.
• okreslTemperatureOdcienia(h) – zwraca 'warm', 'cool' lub 'neutral'.
• SRODEK_ODCIENIA_TEMPERATURY = {warm:30, cool:220, neutral:null} – „serce” strefy (pomarańcz / niebieski), w stronę którego przyciągamy odcienie. null = brak przyciągania.
• dopasujOdcienDoTemperatury(h,temperatura,sila=0.5) – przesuwa odcień o ułamek sila drogi do środka strefy (najkrótszą drogą po kole). 0.5 = w połowie; 1 = pełne dopasowanie. Używana w generatorze, w ocenie harmonii i przy losowaniu koloru referencyjnego (tam 0.85).
• odlegloscOdcieni(a,b) – najkrótsza odległość kątowa (0–180°). Używana w ocenie harmonii i podobieństwa.

SEKCJA 4: Schematy harmonii
SCHEMATY_ODSUNIEC – listy przesunięć odcienia (w stopniach) względem koloru referencyjnego, tylko dla dogenerowanych kolorów (referencyjny się nie zmienia). Każda lista ma 4 wartości, bo paleta ma maks. 5 kolorów = 1 referencyjny + 4 dogenerowane.
• jednobarwna: [0,0,0,0] – ten sam odcień, różnią się S/L
• analogiczna: [-30,30,-55,55] – sąsiedzi na kole
• komplementarna: [180,160,200,180] – przeciwieństwo i okolice
• triadyczna: [120,240,120,240] – trzy punkty co 120°
• rozdzielonoKomplementarna: [150,210,150,210] – „split complementary”
• domyslna: [-40,40,150,180] – gdy brak wybranych tagów
wybierzSchematHarmonii(cechy, nastroj) – wybiera jeden schemat według kolejności priorytetów (pierwszy pasujący wygrywa): chaotic → triadyczna; energetic → rozdzielonoKomplementarna; professional lub calm → analogiczna; clean → jednobarwna; neon → komplementarna; w pozostałych przypadkach → domyślna. Jest deterministyczna (te same filtry = ten sam schemat). Wywołują ją generator i ocenHarmonie.

SEKCJA 5: Warianty nasycenia i jasności
policzWariantNasycJasn(hslReferencyjny, wariant) – dla numeru wariant zwraca {s,l} liczone względem nasycenia (s0) i jasności (l0) koloru referencyjnego, więc dogenerowane kolory „pamiętają” charakter koloru użytkownika. Jest 6 gotowych wzorców (wariant % 6):
• 0 – pastelowy jasny: s0*0.70, l0+22 (maks. 92)
• 1 – lekko jaśniejszy: s0*0.90, l0+12 (maks. 86)
• 2 – nasycony ciemniejszy: s0*1.10+3, l0-8 (min. 18)
• 3 – przygaszony ciemny: s0*0.60, l0-22 (min. 12)
• 4 – mocno nasycony, jasność ściągnięta do środka: s0*1.25+4, 50+(l0-50)*0.45
• domyślny (5) – stonowany: s0*0.80, 50+(l0-50)*0.25
Potem dodawany jest „szum”, który daje różnorodność w całej puli: s += ((wariant%5)-2)*3.2 oraz l += ((floor(wariant/5)%5)-2)*4.2. Na końcu wartości są przycinane: s do 4–96, l do 8–94.

SEKCJA 6: Generowanie puli kandydatów
generujKandydatow(filtry, hslReferencyjny, iloscKandydatow) zwraca tablicę palet:
1. iloscDogenerowanych = rozmiarPalety - 1 (jedno miejsce zajmuje kolor użytkownika).
2. schemat = wynik wybierzSchematHarmonii.
3. Pierwszy element każdej palety to kolorReferencyjnyJakoElementPalety – dokładnie HEX podany przez użytkownika, z flagą referencyjny: true.
4. Dla każdego kolejnego miejsca: przesunięcie ze schematu (schemat[miejsce % długość]) + losowy szum odcienia ±10° → korekta temperatury (dopasujOdcienDoTemperatury) → normalizacja do 0–360.
5. wariant = i + miejsce*7 (i = numer kandydata) – dzięki temu różne miejsca w palecie dostają różne wzorce S/L. s i l pochodzą z policzWariantNasycJasn.
6. Kolor zapisywany jako {h,s,l,hex,referencyjny:false}.
usunDuplikatyPalet(palety) – usuwa palety identyczne co do wszystkich kodów HEX (klucz = hexy połączone myślnikami, sprawdzane przez Set).

SEKCJA 7: Oceny cząstkowe (każda zwraca 0–100)
• ocenHarmonie(paleta, hslReferencyjny, filtry) – dla każdego dogenerowanego koloru bierze najbliższy „docelowy” odcień ze schematu (referencyjny.h + offset, z tą samą korektą temperatury co w generatorze, żeby nie karać palety za celowe przesunięcie). Wynik koloru: 100 − odległość*2.5; ocena = średnia. Sam kolor referencyjny jest pomijany.
• ocenKontrast(paleta, wysokiKontrast) – średni współczynnik kontrastu WCAG ze wszystkich par kolorów (z referencyjnym). Przy włączonym „high contrast”: (średni−1)/5*100 (nagradza ostro); bez niego: 100 − min(45, (średni−1)/9*45) (tylko łagodna kara za brak kontrastu).
• ocenTemperature(paleta, temperatura) – dla neutral zawsze 100; w innym razie każdy kolor (też referencyjny) dostaje 100, jeśli pasuje do wybranej strefy, i 35, jeśli nie; ocena = średnia.
• ocenBalansJasnosci(paleta, ciemnyMotyw) – rozstęp jasności (max L − min L) porównywany z celem: 55 przy ciemnym motywie, 45 w pozostałych przypadkach. Wynik: 100 − min(100, |rozstęp − cel|*1.6).
• DOCELOWE_NASYCENIE_DLA_TAGU – docelowe średnie nasycenie dla tagu: neon 82, professional 32, clean 25, calm 28, energetic 72. chaotic celowo nie ma wartości (oceniany inaczej).
• ocenBalansNasycenia(paleta, filtry) – łączy tagi z cechy i nastroj, uśrednia ich cele (brak tagów → cel neutralny 55) i porównuje ze średnim nasyceniem palety: 100 − clamp(|różnica|*1.4).
• ocenStylINastroj(paleta, filtry) – ocenia każdy tag osobno i uśrednia: neon (cel S=85, mnożnik 1.2), professional (S=35, 1.3), calm (S=30, 1.3), energetic (S=68, 1.1), clean (średnie L=78, 1.1), chaotic (nagradza rozrzut nasycenia: odchylenie*3.2). Brak tagów → neutralne 70.
• ocenTrybCiemny(paleta) – 100 − |średnie L − 32|*1.4 + (liczba kolorów z L<45)*4, przycięte do 0–100. Liczona tylko przy włączonym ciemnym motywie.

SEKCJA 8: Wynik końcowy i twarde wymagania
ocenPelnaPalete(paleta, filtry, hslReferencyjny) wywołuje wszystkie oceny z sekcji 7 (ocenTrybCiemny tylko gdy ciemnyMotyw, inaczej 100) i łączy je wagami:
• harmonia 0.24, kontrast 0.18, styl/nastrój 0.18
• balans nasycenia 0.12, balans jasności 0.12
• temperatura 0.10, tryb ciemny 0.06
(suma wag = 1). Zwraca obiekt: calkowity, harmonia, kontrast, nastroj, balans (średnia z obu balansów), temperatura, tryCiemny – wszystko zaokrąglone. Te wartości trafiają na karty wyników.
spelniaTwardeWymagania(wynikOceny, filtry) – odrzuca paletę, gdy: „high contrast” jest włączony i kontrast < 35, albo „dark theme” jest włączony i tryCiemny < 35. Próg 35 to jedyna „twarda” bramka; reszta to punktacja.

SEKCJA 9: Różnorodność wyników
• podobienstwoPalet(A,B) – porównuje kolory pozycja po pozycji. Dla każdej pary: 1 − (odległość odcieni/180*0.55 + różnica S/100*0.2 + różnica L/100*0.25); wynik to średnia (1 = identyczne). Odcień waży najwięcej (0.55).
• wybierzZroznicowaneWyniki(posortowane, docelowaLiczba) – idzie po liście od najlepiej ocenionej i pomija palety zbyt podobne (podobieństwo większe niż próg) do już wybranych. Próg rośnie po kolei: 0.55 → 0.7 → 0.82 → 0.9 → 0.96 → 1. Mały próg = surowa selekcja (bardzo różne wyniki), duży = łagodna. Zaczyna od surowego i łagodzi, aż zbierze docelowaLiczba palet; jeśli się nie da, zwraca najdłuższy znaleziony zestaw.

SEKCJA 10: Funkcja główna algorytmu
uruchomAlgorytmWyszukiwania(filtry) – spina wszystko:
1. hslReferencyjny = hexNaHsl(filtry.kolorReferencyjny).
2. ILOSC_KANDYDATOW = 150 → generujKandydatow → usunDuplikatyPalet.
3. Filtrowanie twardymi wymaganiami (ocenPelnaPalete + spelniaTwardeWymagania).
4. Gdy nic nie przeszło – łagodzenie w kolejności: najpierw wyłączany „high contrast”, potem „dark theme”; na końcu (ostateczność) bierze się całą pulę. Każde złagodzenie dopisuje komunikat do tablicy ostrzezenia.
5. Przeżywające palety są oceniane względem oryginalnych filtry (nie poluzowanych), więc procenty na kartach są uczciwe, i sortowane malejąco po calkowity.
6. DOCELOWA_LICZBA_WYNIKOW = 6 → wybierzZroznicowaneWyniki.
7. Zwraca { wyniki: [{paleta, wynik}], ostrzezenia, statystyki: {liczbaKandydatow, liczbaPoFiltrowaniu, liczbaWynikow} }.
zbudujOpisPalety(filtry) – tekst pod paletą: tagi z nastroj, potem cechy, potem temperatura (jeśli nie neutral), połączone przecinkami; bez niczego → 'custom palette'.

SEKCJA 11: Interfejs – elementy DOM i formularz
• Stałe z document.getElementById(…) – referencje do elementów strony: panel i przycisk wyszukiwania (przyciskWyszukiwania, panelWyszukiwania), formularz (formularzFiltrow), pola filtrów (poleKolorTekst, poleKolorPicker, podpowiedzKoloru, poleRozmiarPalety, etykietaRozmiaruPalety, grupaCech, grupaNastroju, poleCiemnyMotyw, poleWysokiKontrast, poleTemperatura) oraz miejsca na wyniki (sekcjaWynikow, kontenerWynikow, kontenerOstrzezen, pigulkiFiltrow, statystykiGenerowania, przyciskWyczyscWyniki, kontenerPopularnych).
• NAZWY_TEMPERATURY = ['cool','neutral','warm'] – tłumaczy pozycję suwaka (0/1/2) na nazwę temperatury używaną w algorytmie.
• Obsługa zdarzeń: klik w pasek wyszukiwania pokazuje/chowa panel; picker koloru i pole tekstowe synchronizują się nawzajem (przy błędnym HEX-ie pojawia się tylko delikatna podpowiedź); suwak rozmiaru aktualizuje etykietę z liczbą kolorów; klik w chip przełącza klasę aktywny (wielokrotny wybór).
• pobierzAktywneChipy(kontener) – zwraca tablicę data-value zaznaczonych chipów (wartości cechy / nastroj).
• odczytajFiltryZFormularza() – składa obiekt filtry. Gdy kolor jest pusty lub błędny: losuje odcień, przyciąga go do wybranej temperatury (siła 0.85), nasycenie z zakresu 45–70 i jasność 45–60, wpisuje wynik do pól formularza i ustawia kolorByłWylosowany = true. Dopisuje #, jeśli go brakuje.
SEKCJA 12: Renderowanie wyników
• utworzWierszWyniku(etykieta, wartosc) – jeden pasek oceny (np. „Harmony 94”); szerokość wypełnienia ustawia zmienna CSS --wynik.
• utworzKarteWyniku(paleta, opis, wynik) – karta wyniku: kafelki kolorów (na referencyjnym plakietka „Your color”, etykiety HEX z klasą z kolorTekstuDlaTla), opis, „% match” (wynik.calkowity) i cztery paski: Harmony, Contrast, Mood, Balance.
• utworzProstaKarte(listaHex, opis) – uproszczona karta (bez ocen) dla sekcji „Popular right now”.
• utworzPigulkeFiltra(tekst, kolorKropki) – mała „pigułka” z nazwą filtru (opcjonalnie z kolorową kropką).
• wyrenderujPigulkiFiltrow(filtry) – pokazuje nad wynikami, o co użytkownik poprosił: kolor, rozmiar, cechy, nastrój, temperaturę (jeśli nie neutralna), dark theme, high contrast.
• wyrenderujOstrzezenia(lista) – żółty baner z komunikatami; przy pustej liście nic nie rysuje.
• Obsługa submit formularza (kolejność): odczytajFiltryZFormularza → uruchomAlgorytmWyszukiwania → zbudujOpisPalety → złożenie ostrzeżeń (informacja o wylosowanym kolorze + ostrzeżenia algorytmu) → pigułki → tekst statystyk („Checked X candidates, Y matched…”) → karty wyników (lub komunikat o braku palet) → pokazanie sekcji wyników, przewinięcie do niej i schowanie panelu filtrów.
• Obsługa „Clear results” – czyści wyniki, ostrzeżenia, pigułki i statystyki i chowa sekcję. Filtry w formularzu zostają.

SEKCJA 13: „Popular right now”
• PRZYKLADOWE_POPULARNE_PALETY – statyczna lista 6 palet {kolory, opis}. To dane przykładowe (placeholder) do czasu podpięcia bazy danych; nie są wynikiem algorytmu.
• wyrenderujPopularnePalety() – rysuje je w kontenerPopularnych przez utworzProstaKarte. Wywoływana raz na samym końcu pliku, przy wczytaniu strony.


Gdzie można zmieniać podstawowe rzeczy:
• Liczba kandydatów: ILOSC_KANDYDATOW (sekcja 10); liczba wyników: DOCELOWA_LICZBA_WYNIKOW
• Jak mocno zmienia się odcień między kandydatami: szum ±10 w generujKandydatow; różnorodność S/L: mnożniki 3.2 i 4.2 w policzWariantNasycJasn
• Co to znaczy „ciepły/zimny”: STREFA_CIEPLA, STREFA_ZIMNA
• Wzory harmonii: SCHEMATY_ODSUNIEC; które tagi je wybierają: wybierzSchematHarmonii
• Ile ważą kryteria: wagi w ocenPelnaPalete; jak surowe są filtry: progi 35 w spelniaTwardeWymagania
• Jak bardzo wyniki mają się różnić: lista progów w wybierzZroznicowaneWyniki