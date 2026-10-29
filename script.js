// -1- konwersja kolorów HEX <-> RGB <-> HSL
// pracujemy na HSL bo tam odcień (H) to pozycja na kole
// kolorów (0-360), możemy nim obracać aby uzyskać harmonijne kombinacje

function hexNaRgb(hex){
    const oczyszczonyHex = hex.replace('#', '').trim();
    const pelnyHex = oczyszczonyHex.length===3
        ? oczyszczonyHex.split('').map(znak=>znak+znak).join('')
        :oczyszczonyHex;
    const LiczbaCalkowita = parseInt(pelnyHex,16);
    return{
        r:(LiczbaCalkowita >> 16) & 255,
        g:(LiczbaCalkowita >> 8) & 255,
        b:LiczbaCalkowita & 255
    };
}

function rgbNaHex(r,g,b){
    const skladowaNaHex = (skladowa) =>{
        const wartosc=Math.round(Math.min(255,Math.max(0, skladowa)));
        return wartosc.toString(16).padStart(2,'0');
    };
    return `#${skladowaNaHex(r)}${skladowaNaHex(g)}${skladowaNaHex(b)}`;
}

function rgbNaHsl(r,g,b){
    r/=255; g/=255;b/=255;
    const maksimum = Math.max(r,g,b);
    const minimum = Math.min(r,g,b);
    const roznica = maksimum - minimum;
    let odcien = 0;
    let nasycenie = 0;
    const jasnosc = (maksimum + minimum)/2;

    if(roznica !==0){
        nasycenie = jasnosc>0.5
        ? roznica/(2-maksimum-minimum)
        :roznica/(maksimum+minimum);
        switch(maksimum){
            case r: odcien = ((g-b)/roznica)+(g<b ? 6 : 0); break;
            case g: odcien = ((b-r)/roznica)+2; break;
            case b: odcien = ((r-g)/roznica)+4; break;
        }
        odcien*=60;
    }
    return{h:Math.round(odcien), s:Math.round(nasycenie*100),l: Math.round(jasnosc*100)};
}

function hslNaRgb(h,s,l){
    h=((h%360)+360)%360;
    s=s/100;
    l=l/100;
    const policzSkladowa=(przesuniecie)=>{
        const k=(przesuniecie+h/30)%12;
        const a=s*Math.min(l,1-l);
        return l-a*Math.max(-1,Math.min(k-3,9-k,1));
    };
    return{
        r:Math.round(policzSkladowa(0)*255),
        g:Math.round(policzSkladowa(8)*255),
        b:Math.round(policzSkladowa(4)*255)
    };
}

function hexNaHsl(hex){
    const{r,g,b}=hexNaRgb(hex);
    return rgbNaHsl(r,g,b);
}

function hslNaHex(h,s,l){
    const{r,g,b} = hslNaRgb(h,s,l);
    return rgbNaHex(r,g,b);
}

function czyPoprawnyHex(tekst){
    if(!tekst) return false;
    const oczyszczony = tekst.trim();
    return /^#?[0-9A-Fa-f]{6}$/.test(oczyszczony) || /^#?[0-9A-Fa-f]{3}$/.test(oczyszczony);
}

function losowaLiczbaCalkowita(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
}

// średnia arytmetyczna liczb z tablicy (będzie używana w wielu miejcach oceny)
function sredniaZTablicy(liczby){
    if (!liczby.length) return 0;
    return liczby.reduce((suma,x)=>suma+x,0)/liczby.length;
}
// Odchylenie standardowe — mówi, jak bardzo liczby w tablicy się od siebie
// różnią. Używamy go np. do nagradzania "chaotycznych" palet za zróżnicowanie.
function odchylenieStandardowe(liczby){
    if(liczby.length<2) return 0;
    const srednia = sredniaZTablicy(liczby);
    const wariacja= sredniaZTablicy(liczby.map(x=>Math.pow(x-srednia,2)));
    return Math.sqrt(wariacja);
}
// Utrzymuje wartość w podanym zakresie min,max
function ogranicz(wartosc, min, max){
    return Math.max(min, Math.min(max, wartosc));
}

// -2- Kontrast WCAG (luminacja względna + współczynnik kontrastu)
function luminacjaWzglednia(hex){
    const{r,g,b}=hexNaRgb(hex);
    const kanaly = [r,g,b].map(wartosc =>{
        const c = wartosc/255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * kanaly[0] + 0.7152 * kanaly[1] + 0.0722 * kanaly[2];
}

function wspolczynnikKontrastu(hexA, hexB){
    const l1 = luminacjaWzglednia(hexA);
    const l2 = luminacjaWzglednia(hexB);
    const jasniejsza = Math.max(l1,l2);
    const ciemniejsza= Math.min(l1,l2);
    return (jasniejsza+0.05)/(ciemniejsza+0.05);
}

// dobieranie koloru tekstu który będzie czytelny na danym tle (do etykiet z kodem HEX na kolorach palety)
function kolorTekstuDlaTla(hex){
    return luminacjaWzglednia(hex)>0.42? 'ciemna':'jasna';
}

// -3- Strefy temperatury bartwy (zimny/neutralny/ciepły)
// (uproszczenie koła kolorów do 3 stref - odcien to jedyny czynnik brany pod uwagę)
const STREFA_CIEPLA = {start: 330, koniec:70};
const STREFA_ZIMNA = {start:160, koniec:280};

function czyOdcinekWZakresie(h,start,koniec){
    if(start<=koniec) return h>=start && h<=koniec;
    return h>=start||h<=koniec;
}

function okreslTemperatureOdcienia(h){
    if(czyOdcinekWZakresie(h, STREFA_CIEPLA.start, STREFA_CIEPLA.koniec)) return 'warm';
    if(czyOdcinekWZakresie(h,STREFA_ZIMNA.start, STREFA_ZIMNA.koniec)) return 'cool';
    return 'neutral';
}

const SRODEK_ODCIENIA_TEMPERATURY = {warm:30,cool:220,neutral:null};

function dopasujOdcienDoTemperatury(h, temperatura, sila = 0.5){
    const celowyOdcien = SRODEK_ODCIENIA_TEMPERATURY[temperatura];
    if(celowyOdcien === null||celowyOdcien===undefined) return h;
    let roznica = celowyOdcien - h;
    if(roznica>180) roznica -=360;
    if(roznica<-180) roznica +=360;
    const nowyOdcien = h+roznica*sila;
    return((nowyOdcien%360)+360)%360;
}
// najkrótsza odległość kątowa między dwoma odcieniami na kole kolorów (0-180)
function odlegloscOdcieni(a,b){
    const roznica = Math.abs(((a%360)+360)%360 - ((b%360)+360)%360);
    return Math.min(roznica,360-roznica);
}

const SCHEMATY_ODSUNIEC ={
    jednobarwna:[0,0,0,0], // ten sam odcien będzie się różnił S / L
    analogiczna:[-30,30,-55,55], // sąsiedzi na kole kolorów
    komplemenrarna:[180,160,200,180], // przeciwienstwo + warianty wokół niego
    triadyczna:[120,240,120,240], // trzy punkty co 120 stopni
    rozdzielnoKomplementarna:[150,210,150,210], //spilt complementary
    domyslna: [-40,40,150,180] // w przypadku braku preferencji użytkownika
}

// wybór schematu harmonii
function wybierzSchematHarmonii(cechy, nastroj){
    const wybrano = (tag) => cechy.includes(tag)||nastroj.includes(tag);

    if(wybrano('chaotic')) return SCHEMATY_ODSUNIEC.triadyczna;
    if(wybrano('energetic')) return SCHEMATY_ODSUNIEC.rozdzielnoKomplementarna;
    if(wybrano('professional')|| wybrano('calm')) return SCHEMATY_ODSUNIEC.analogiczna;
    if(wybrano('clean')) return SCHEMATY_ODSUNIEC.jednobarwna;
    if(wybrano('neon')) return SCHEMATY_ODSUNIEC.komplemenrarna;
    return SCHEMATY_ODSUNIEC.domyslna;
}

// -4- Warianty nasycenia / jasnosci wokol koloru referencyjnego
function policzWariantNasycJasn(hslReferencyjny, wariant){
    const s0=hslReferencyjny.s;
    const l0=hslReferencyjny.l;
    let s,l;

    switch(wariant%6){
        case 0: //pastelowa, jasna wersja
            s = s0*0.70;
            l = Math.min(92,l0+22);
            break;
        case 1: //lekko jaśniejsza
            s = s0*0.90;
            l = Math.min(86,l0+12);
            break;
        case 2: //bardziej nasycona, przyciemniona
            s = Math.min(95, s0*1.10+3);
            l = Math.max(18,l0-8);
            break;
        case 3: //przygaszona, ciemna
            s = s0*0.60;
            l = Math.max(12,l0-22);
            break;
        case 4: //mocno nasycona , jasność ściągnięta do środka skali
            s = Math.min(95,s0*1.25+4);
            l = 50+(l0-50)*0.45;
            break;
        default: // zbalansowana, stonowana
            s=s0*0.80;
            l=50+(l0-50)*0.25;
    }
    // dodanie "szumu" dla kolejnych kandydatów do palety aby były różnorodne
    s+=((wariant%5)-2)*3.2;
    l+=((Math.floor(wariant/5)%5)-2)*4.2;
    return { s:ogranicz(s,4,96),l: ogranicz(l,8,94)};
}

function generujKandydatow(filtry, hslReferencyjny, iloscKandydatow){
    const iloscDogenerowanych = filtry.rozmiarPalety -1; // -1 bo referencyjny zajmuje pierwsze mijesce
    const schemat = wybierzSchematHarmonii(filtry.cechy, filtry.nastroj);
    const kandydaci = [];

    const kolorReferencyjnyJakoElementPalety = {
        h:hslReferencyjny.h,
        s:hslReferencyjny.s,
        l:hslReferencyjny.l,
        hex: filtry.kolorReferencyjny,
        referencyjny: true
    };

    for (let i =0; i<iloscKandydatow; i++){
        const koloryDogenerowane = [];
        for (let miejsce = 0; miejsce<iloscDogenerowanych; miejsce++){
            const przesuniecieBazowe = schemat[miejsce%schemat.length];
            const szumOdcienia = losowaLiczbaCalkowita(-10, 10);

            let odcien = hslReferencyjny.h+przesuniecieBazowe+szumOdcienia
            odcien=dopasujOdcienDoTemperatury(odcien,filtry.temperatura);
            odcien = ((odcien%360)+360)%360;

            const wariant = i+miejsce*7;
            const {s,l}=policzWariantNasycJasn(hslReferencyjny,wariant);

            koloryDogenerowane.push({h:Math.round(odcien),s:Math.round(s), l:Math.round(l), hex: hslNaHex(odcien,s,l),referencyjny: false});
        }
        kandydaci.push([kolorReferencyjnyJakoElementPalety, ...koloryDogenerowane]);
    }
    return kandydaci;
}

// usuwanie palety identyczne co do koloru
function usunDuplikatyPalet(palety){
    const widziane = new Set();
    return palety.filter(paleta=>{
        const klucz = paleta.map(k=>k.hex).join('-');
        if(widziane.has(klucz)) return false;
        widziane.add(klucz);
        return true;
    });
}

// -5- Oceny cząstkowe (wielokryterialna ocena każda funkcja patrzy na jeden aspekt palety i zwraca ocene)

// 1) harmonia - jak blisko wyznaczonych odcieni są dogenerowane kolory
function ocenHarmonie(paleta, hslReferencyjny, filtry){
    const dogenerowane= paleta.filter(k => !k.referencyjny);
    if(!dogenerowane.length) return 100;

    const schemat = wybierzSchematHarmonii(filtry.cechy, filtry.nastroj);
    const docelowe = schemat.map(offset =>{
        const surowyOdcien = ((hslReferencyjny.h+offset)%360+360)%360;
        return dopasujOdcienDoTemperatury(surowyOdcien, filtry.temperatura);
    });
    const wyniki = dogenerowane.map(kolor=>{
        const najblizsza = Math.min(...docelowe.map(d=>odlegloscOdcieni(kolor.h,d)));
        return Math.max(0,100 - najblizsza*2.5);
    });
    return sredniaZTablicy(wyniki);
} 
// 2) kontrast - średni wspolczynnik kontrastu WCAG miedzy każdą parą kolorów w palecie
function ocenKontrast(paleta, wysokiKontrast) {
    const wspolczynniki = [];
    for (let i=0; i< paleta.length; i++){
        for(let j = i + 1; j<paleta.length; j++){
            wspolczynniki.push(wspolczynnikKontrastu(paleta[i].hex,paleta[j].hex));
        }
    }
    const sredni = sredniaZTablicy(wspolczynniki);

    if (wysokiKontrast){
        return ogranicz((sredni -1)/5*100,0,100);
    }
    return 100 - ogranicz((sredni -1)/9*45,0,45);
}
// 3) temperatura - czy kolory pasują do wybranej strefy temperatury
function ocenTemperature(paleta, temperatura){
    if(temperatura==='neutral') return 100;
    const dopasowania = paleta.map(k=>(okreslTemperatureOdcienia(k.h)===temperatura?100:35));
    return sredniaZTablicy(dopasowania);
}
//  4) balans jasności - rozstęp miedzy najciemniejszym a najjaśniejszym kolorem
function ocenBalansJasnosci(paleta, ciemnyMotyw){
    const jasnosci = paleta.map(k=>k.l);
    const rozstep = Math.max(...jasnosci) - Math.min(...jasnosci);
    const cel = ciemnyMotyw ? 55:45;
    return 100 - Math.min(100, Math.abs(rozstep-cel)*1.6);
}
const DOCELOWE_NASYCENIE_DLA_TAGU={
    neon: 82,
    professional: 32,
    clean: 25,
    calm: 28,
    energetic: 72
};
//  5) balans nasycenia - średnie nasycenie całej palety powinno być bliskie
// temu, czego oczekuje wybrana kombinacja cech/nastroju 
function ocenBalansNasycenia(paleta,filtry){
    const wszystkieTagi = [...filtry.cechy, ...filtry.nastroj];
    const docelowe = wszystkieTagi.map(tag=>DOCELOWE_NASYCENIE_DLA_TAGU[tag]).filter(v=>v!==undefined);
    const cel = docelowe.length?sredniaZTablicy(docelowe):55;
    const srednieNasycenie = sredniaZTablicy(paleta.map(k=>k.s));
    return 100 - ogranicz(Math.abs(srednieNasycenie - cel) *1.4, 0, 100);
}
//  6) styl / nastrój
function ocenStylINastroj(paleta,filtry){
    const wszystkieTagi = [...filtry.cechy, ...filtry.nastroj];
    if (!wszystkieTagi.length) return 70;
    const nasycenia = paleta.map(k=>k.s);
    const jasnosci = paleta.map(k=>k.l);
    const sredNasyc = sredniaZTablicy(nasycenia);
    const sredJasn = sredniaZTablicy(jasnosci);
    const odchylenieNasyc = odchylenieStandardowe(nasycenia);

    const wyniki = [];
    wszystkieTagi.forEach(tag=>{
        switch(tag){
            case 'neon': wyniki.push(100-Math.abs(sredNasyc-85)*1.2); break;
            case 'professional': wyniki.push(100-Math.abs(sredNasyc -35)*1.3); break;
            case 'chaotic': wyniki.push(ogranicz(odchylenieNasyc *3.2, 0, 100)); break;
            case 'clean': wyniki.push(100-Math.abs(sredJasn -78)*1.1); break;
            case 'calm': wyniki.push(100-Math.abs(sredNasyc - 30)*1.3); break;
            case 'energetic': wyniki.push(100-Math.abs(sredNasyc-68)*1.1); break;
        }
    });
    return sredniaZTablicy(wyniki.map(w=>ogranicz(w, 0, 100)));
}
//  7) Tryb ciemny - liczymy tylko gdy user zaznaczy darkmode
function ocenTrybCiemny(paleta){
    const sredniaJasnosc = sredniaZTablicy(paleta.map(k=>k.l));
    const liczbaCiemnych = paleta.filter(k=>k.l<45).length;
    return ogranicz(100 - Math.abs(sredniaJasnosc-32)*1.4+liczbaCiemnych*4,0,100);
}

// --Wynik końcow (ważona suma ocen cząstkowych)
function ocenPelnaPalete(paleta, filtry, hslReferencyjny){
    const harmonia = ocenHarmonie(paleta,hslReferencyjny,filtry);
    const kontrast = ocenKontrast(paleta, filtry.wysokiKontrast);
    const temperatura = ocenTemperature(paleta, filtry.temperatura);
    const balansJasnosci = ocenBalansJasnosci(paleta, filtry.ciemnyMotyw);
    const balansNasycenia = ocenBalansNasycenia(paleta, filtry);
    const stylNastroj = ocenStylINastroj(paleta, filtry);
    const tryCiemny = filtry.ciemnyMotyw ? ocenTrybCiemny(paleta):100;
    
    const wynikKoncowy=
        harmonia*0.24
        +kontrast*0.18
        +stylNastroj*0.18
        +balansNasycenia*0.12
        +balansJasnosci*0.12
        +temperatura*0.10
        +tryCiemny*0.06
    
    return{
        calkowity: Math.round(ogranicz(wynikKoncowy, 0, 100)),
        harmonia: Math.round(harmonia),
        kontrast: Math.round(kontrast),
        nastroj: Math.round(stylNastroj),
        balans: Math.round((balansNasycenia+balansJasnosci)/2),
        temperatura: Math.round(temperatura),
        tryCiemny: Math.round(tryCiemny)
    };
}

// jeśli użytkownik zaznaczył dany filtr a paleta nie spełnia go zbyt dobrze zostaje ona odrzucona
function spelniaTwardeWymagania(wynikOceny, filtry){
    if(filtry.wysokiKontrast&&wynikOceny.kontrast<35) return false;
    if(filtry.ciemnyMotyw&&wynikOceny.tryCiemny<35) return false;
    return true;
}

// -6- Różnorodność wyników (pomijanie palet do wyświetlenia zbyt podobnych do już wyświetlonych)
function podobienstwoPalet(paletaA, paletaB){
    const podobienstwaPozycji = paletaA.map((kolor, index)=>{
        const inny=paletaB[index];
        const dOdcien = odlegloscOdcieni(kolor.h, inny.h)/180;
        const dNasycenie = Math.abs(kolor.s-inny.s)/180;
        const dJasnosc = Math.abs(kolor.l - inny.l)/180;
        return 1-ogranicz(dOdcien*0.55+dNasycenie*0.2+dJasnosc*0.25, 0, 1);
    });
    return sredniaZTablicy(podobienstwaPozycji);
}

function wybierzZroznicowaneWyniki(posortowaneKandydatury, docelowaLiczba){
    const progiPodobienstwa = [0.55, 0.7, 0.82, 0.9, 0.96, 1];
    let najlepszyWybor=[];

    for(const prog of progiPodobienstwa){
        const wybrane = [];
        for(const kandydat of posortowaneKandydatury){
            const zaPodobnyDOJuzWybranego = wybrane.some(
                wynik=> podobienstwoPalet(wynik.paleta, kandydat.paleta)>prog
            );
            if(!zaPodobnyDOJuzWybranego) wybrane.push(kandydat);
            if(wybrane.length>=docelowaLiczba) break;
        }
        if(wybrane.length>najlepszyWybor.length) najlepszyWybor=wybrane;
        if(najlepszyWybor.length>=Math.min(docelowaLiczba, posortowaneKandydatury.length)) break;
    }
    return najlepszyWybor;
}


// -10- ---FUNKCJA GŁÓWNA ALGORYTMU (Spięcie wszystkiego co powyżej)---
/* 
1 analiza koloru referencyjnego
2-3 generowanie kolorów i palet
4 Odrzucanie niepasujących palet
5 Ocena spójności kolorystycznej
6 Wybór i zwracanie wyników
*/
function uruchomAlgorytmWyszukiwania(filtry){
    const hslReferencyjny = hexNaHsl(filtry.kolorReferencyjny);
    const ostrzezenia =[];

    const ILOSC_KANDYDATOW = 150;
    let kandydaci=generujKandydatow(filtry,hslReferencyjny,ILOSC_KANDYDATOW);
    kandydaci=usunDuplikatyPalet(kandydaci);

    let aktywneWymagania = filtry;
    let poFiltrowaniu = kandydaci.filter(
        paleta=>spelniaTwardeWymagania(ocenPelnaPalete(paleta, aktywneWymagania, hslReferencyjny), aktywneWymagania)
    );

    if(poFiltrowaniu.length === 0 && aktywneWymagania.wysokiKontrast){
        aktywneWymagania={...aktywneWymagania, wysokiKontrast: false};
        poFiltrowaniu = kandydaci.filter(
            paleta=>spelniaTwardeWymagania(ocenPelnaPalete(paleta,aktywneWymagania, hslReferencyjny), aktywneWymagania)
        );
        ostrzezenia.push('Żadna paleta nie spełniała kryterium wysokiego kontrastu w połączeniu z pozostałymi filtrami, dlatego wymóg ten został złagodzony.');
    }
    if(poFiltrowaniu.length === 0 && aktywneWymagania.ciemnyMotyw){
        aktywneWymagania = {...aktywneWymagania, ciemnyMotyw: false};
        poFiltrowaniu = kandydaci.filter(
            paleta=> spelniaTwardeWymagania(ocenPelnaPalete(paleta, aktywneWymagania, hslReferencyjny), aktywneWymagania)
        );
        ostrzezenia.push('Żadna paleta nie pasowała do kryterium ciemny motyw w połączeniu z pozostałymi filtrami, więc wymóg ten został złagodzony.');
    }
    if(poFiltrowaniu.length === 0){
        poFiltrowaniu=kandydaci;
        ostrzezenia.push('Nie udało nam się w pełni spełnić wszystkich kryteriów jednocześnie, więc oto najlepiej pasujące wyniki, jakie znaleźliśmy.');
    }

    const ocenieni = poFiltrowaniu
        .map(paleta=>({paleta, wynik: ocenPelnaPalete(paleta, filtry, hslReferencyjny) }))
        .sort((a, b)=>b.wynik.calkowity -a.wynik.calkowity);
    
    const DOCELOWA_LICZBA_WYNIKOW = 6;
    const wyniki = wybierzZroznicowaneWyniki(ocenieni, DOCELOWA_LICZBA_WYNIKOW);

    return{
        wyniki,
        ostrzezenia,
        statystyki:{
            liczbaKandydatow: kandydaci.length,
            liczbaPoFiltrowaniu: poFiltrowaniu.length,
            liczbaWynikow: wyniki.length
        }
    };
}
function zbudujOpisPalety(filtry){
    const etykiety =[...filtry.nastroj, ...filtry.cechy];
    if (filtry.temperatura !== 'neutral') etykiety.push(filtry.temperatura);
    return etykiety.length ? etykiety.join(', ') : 'custom palette';
}


// -11- ---Obsługa interfejsu - elementy DOM---
const przyciskWyszukiwania = document.getElementById('przyciskWyszukiwania');
const panelWyszukiwania = document.getElementById('panelWyszukiwania');
const formularzFiltrow = document.getElementById('formularzFiltrow');

const poleKolorTekst = document.getElementById('kolorReferencyjny');
const poleKolorPicker = document.getElementById('kolorReferencyjnyPicker');
const podpowiedzKoloru = document.getElementById('podpowiedzKoloru');
const poleRozmiarPalety = document.getElementById('rozmiarPalety');
const etykietaRozmiaruPalety = document.getElementById('etykietaRozmiaruPalety');
const grupaCech = document.getElementById('grupaCech');
const grupaNastroju = document.getElementById('grupaNastroju');
const poleCiemnyMotyw = document.getElementById('ciemnyMotyw');
const poleWysokiKontrast = document.getElementById('wysokiKontrast');
const poleTemperatura = document.getElementById('temperatura');

const sekcjaWynikow = document.getElementById('sekcjaWynikow');
const kontenerWynikow = document.getElementById('kontenerWynikow');
const kontenerOstrzezen = document.getElementById('kontenerOstrzezen');
const pigulkiFiltrow = document.getElementById('pigulkiFiltrow');
const statystykiGenerowania = document.getElementById('statystykiGenerowania');
const przyciskWyczyscWyniki = document.getElementById('przyciskWyczyscWyniki');
const kontenerPopularnych = document.getElementById('kontenerPopularnych');

const NAZWY_TEMPERATURY = ['cool', 'neutral', 'warm'];

// otwieranie i zamykanie panelu wyszukiwania
przyciskWyszukiwania.addEventListener('click', ()=>{
    const otwarty = panelWyszukiwania.classList.toggle('ukryty') === false;
    przyciskWyszukiwania.setAttribute('aria-expanded',String(otwarty));
})

// synchronizacja pola tekstowego HEX z color pickerem w wyszukiwaniu
poleKolorPicker.addEventListener('input', ()=>{
    poleKolorTekst.value = poleKolorPicker.value;
    podpowiedzKoloru.textContent='';
});
poleKolorTekst.addEventListener('input',()=>{
    if(poleKolorTekst.value.trim()===''){
        podpowiedzKoloru.textContent='';
        return;
    }
    if(czyPoprawnyHex(poleKolorTekst.value)){
        const hexZKrzyzykiem = poleKolorTekst.value.startsWith('#') ? poleKolorTekst.value : `#${poleKolorTekst.value}`;
        poleKolorPicker.value=hexZKrzyzykiem;
        podpowiedzKoloru.textContent='';
    } else{
        // podpowiedz dla użytkownika
        podpowiedzKoloru.textContent = 'Podaj prawidłowy HEX koloru.';
    }
});

// podgląd wybranego rozmiaru palety obok suwaka
poleRozmiarPalety.addEventListener('input', ()=>{
    etykietaRozmiaruPalety.textContent=poleRozmiarPalety.value;
});

// obsługa chipów onoff
[grupaCech,grupaNastroju].forEach(grupa =>{
    grupa.addEventListener('click',(zdarzenie)=>{
        const chip=zdarzenie.target.closest('.chip');
        if(!chip) return;
        const terazAktywny=chip.classList.toggle('aktywny');
        chip.setAttribute('aria-pressed',String(terazAktywny));
    });
});

function pobierzAktywneChipy(kontenerChipow){
    return[...kontenerChipow.querySelectorAll('.chip.aktywny')].map(chip=>chip.dataset.value);
}

// Odczytywanie filtrów z formularza
function odczytajFiltryZFormularza(){
    let hex=poleKolorTekst.value.trim();
    let kolorByłWylosowany=false;

    if(!czyPoprawnyHex(hex)){
        // użytkownik nic nie wpisał albo wpisał coś niepoprawnego - zamiast
        // przerywać działanie strony, losujemy kolor
        // i pokazujemy go od razu w polu.
        // Losowy odcień od razu dopasowujemy do wybranej temperatury - inaczej wylosowany kolor mógłby
        // z miejsca zaprzeczać jednemu z filtrów, o które właśnie poprosił.
        const temperaturaWybrana=NAZWY_TEMPERATURY[parseInt(poleTemperatura.value,10)];
        let losowyH=losowaLiczbaCalkowita(0,359);
        losowyH=Math.round(dopasujOdcienDoTemperatury(losowyH,temperaturaWybrana,0.85));
        const losowyS = losowaLiczbaCalkowita(45,70);
        const losowyL = losowaLiczbaCalkowita(45,60);
        hex=hslNaHex(losowyH,losowyS,losowyL);
        kolorByłWylosowany=true;
        poleKolorTekst.value=hex;
        poleKolorPicker.value=hex;
        podpowiedzKoloru.textContent='';
    } else if (!hex.startsWith('#')){
        hex=`#${hex}`;
    }
    return{
        kolorReferencyjny: hex.toUpperCase(),
        kolorByłWylosowany,
        rozmiarPalety: parseInt(poleRozmiarPalety.value,10),
        cechy: pobierzAktywneChipy(grupaCech),
        nastroj: pobierzAktywneChipy(grupaNastroju),
        temperatura: NAZWY_TEMPERATURY[parseInt(poleTemperatura.value, 10)],
        ciemnyMotyw: poleCiemnyMotyw.checked,
        wysokiKontrast: poleWysokiKontrast.checked
    };
}

// -12- Renderowanie Wyników

// belka postępu używana przy rozbiciu wyniku
function utworzWierszWyniku(etykieta, wartosc) {
    const wiersz = document.createElement('div');
    wiersz.className = 'wiersz-wyniku';

    const nazwa = document.createElement('span');
    nazwa.textContent = etykieta;

    const pasek = document.createElement('div');
    pasek.className = 'pasek-wyniku';
    const wypelnienie = document.createElement('i');
    wypelnienie.style.setProperty('--wynik', `${wartosc}%`);
    pasek.appendChild(wypelnienie);

    const liczba = document.createElement('b');
    liczba.textContent = wartosc;

    wiersz.append(nazwa, pasek, liczba);
    return wiersz;
}

// Karta pojedynczej palety wyszukiwania - z tagiem "your color" na
// referencyjnym kolorze oraz z rozbiciem oceny na czynniki cząstkowe
function utworzKarteWyniku(paleta, opisTekstowy, wynik) {
    const karta = document.createElement('article');
    karta.className = 'karta-palety';

    const paskiKolorow = document.createElement('div');
    paskiKolorow.className = 'karta-palety_kolory';

    paleta.forEach(kolor => {
        const swatch = document.createElement('div');
        swatch.className = 'karta-palety_swatch';
        swatch.style.backgroundColor = kolor.hex;

        if (kolor.referencyjny) {
            const tag = document.createElement('span');
            tag.className = 'karta-palety_tag-referencyjny';
            tag.textContent = 'Your color';
            swatch.appendChild(tag);
        }

        const etykietaHex = document.createElement('span');
        etykietaHex.className = `karta-palety_etykieta-hex ${kolorTekstuDlaTla(kolor.hex)}`;
        etykietaHex.textContent = kolor.hex.toUpperCase();
        swatch.appendChild(etykietaHex);

        paskiKolorow.appendChild(swatch);
    });

    const info = document.createElement('div');
    info.className = 'karta-palety_info';

    const gorna = document.createElement('div');
    gorna.className = 'karta-palety_gorna-linia';
    const opis = document.createElement('p');
    opis.className = 'karta-palety_opis';
    opis.textContent = opisTekstowy;
    const dopasowanie = document.createElement('span');
    dopasowanie.className = 'karta-palety_dopasowanie';
    dopasowanie.textContent = `${wynik.calkowity}% match`;
    gorna.append(opis, dopasowanie);

    const rozbicie = document.createElement('div');
    rozbicie.className = 'karta-palety_wyniki-czastkowe';
    rozbicie.append(
        utworzWierszWyniku('Harmony', wynik.harmonia),
        utworzWierszWyniku('Contrast', wynik.kontrast),
        utworzWierszWyniku('Mood', wynik.nastroj),
        utworzWierszWyniku('Balance', wynik.balans)
    );

    info.append(gorna, rozbicie);
    karta.append(paskiKolorow, info);
    return karta;
}

// Prostsza karta - używana wyłącznie w sekcji "Popular right now", gdzie
// nie mamy wyniku dopasowania
function utworzProstaKarte(listaKolorowHex, opisTekstowy) {
    const karta = document.createElement('article');
    karta.className = 'karta-palety';

    const paskiKolorow = document.createElement('div');
    paskiKolorow.className = 'karta-palety_kolory';
    listaKolorowHex.forEach(hex => {
        const swatch = document.createElement('div');
        swatch.className = 'karta-palety_swatch';
        swatch.style.backgroundColor = hex;
        const etykietaHex = document.createElement('span');
        etykietaHex.className = `karta-palety_etykieta-hex ${kolorTekstuDlaTla(hex)}`;
        etykietaHex.textContent = hex.toUpperCase();
        swatch.appendChild(etykietaHex);
        paskiKolorow.appendChild(swatch);
    });

    const info = document.createElement('div');
    info.className = 'karta-palety_info';
    const opis = document.createElement('p');
    opis.className = 'karta-palety_opis';
    opis.textContent = opisTekstowy;
    info.appendChild(opis);

    karta.append(paskiKolorow, info);
    return karta;
}

// Pigułka podsumowująca jeden z zastosowanych filtrów (pokazywana nad
// wynikami)
function utworzPigulkeFiltra(tekst, kolorKropki) {
    const pigulka = document.createElement('span');
    pigulka.className = 'pigulka-filtra';
    if (kolorKropki) {
        const kropka = document.createElement('i');
        kropka.className = 'pigulka-filtra_kropka';
        kropka.style.backgroundColor = kolorKropki;
        pigulka.appendChild(kropka);
    }
    pigulka.append(document.createTextNode(tekst));
    return pigulka;
}

function wyrenderujPigulkiFiltrow(filtry) {
    pigulkiFiltrow.innerHTML = '';
    pigulkiFiltrow.appendChild(utworzPigulkeFiltra(filtry.kolorReferencyjny, filtry.kolorReferencyjny));
    pigulkiFiltrow.appendChild(utworzPigulkeFiltra(`${filtry.rozmiarPalety} colors`));
    filtry.cechy.forEach(cecha => pigulkiFiltrow.appendChild(utworzPigulkeFiltra(cecha)));
    filtry.nastroj.forEach(nastroj => pigulkiFiltrow.appendChild(utworzPigulkeFiltra(nastroj)));
    if (filtry.temperatura !== 'neutral') pigulkiFiltrow.appendChild(utworzPigulkeFiltra(filtry.temperatura));
    if (filtry.ciemnyMotyw) pigulkiFiltrow.appendChild(utworzPigulkeFiltra('dark theme'));
    if (filtry.wysokiKontrast) pigulkiFiltrow.appendChild(utworzPigulkeFiltra('high contrast'));
}

function wyrenderujOstrzezenia(listaOstrzezen) {
    kontenerOstrzezen.innerHTML = '';
    if (!listaOstrzezen.length) return;
    const baner = document.createElement('div');
    baner.className = 'baner-ostrzezenia';
    listaOstrzezen.forEach(tekst => {
        const linia = document.createElement('p');
        linia.textContent = `⚠ ${tekst}`;
        baner.appendChild(linia);
    });
    kontenerOstrzezen.appendChild(baner);
}

// --- Obsługa wysłania formularza filtrów ("Zobaczmy ->") ---
formularzFiltrow.addEventListener('submit', (zdarzenie) => {
    zdarzenie.preventDefault();

    const filtry = odczytajFiltryZFormularza();
    const wynikAlgorytmu = uruchomAlgorytmWyszukiwania(filtry);
    const opisDlaWynikow = zbudujOpisPalety(filtry);

    // ostrzeżenia
    const wszystkieOstrzezenia = [
        ...(filtry.kolorByłWylosowany
            ? [`No reference color was given, so we picked ${filtry.kolorReferencyjny} for you.`]
            : []),
        ...wynikAlgorytmu.ostrzezenia
    ];
    wyrenderujOstrzezenia(wszystkieOstrzezenia);
    wyrenderujPigulkiFiltrow(filtry);

    statystykiGenerowania.textContent =
        `Checked ${wynikAlgorytmu.statystyki.liczbaKandydatow} candidates, ` +
        `${wynikAlgorytmu.statystyki.liczbaPoFiltrowaniu} matched your requirements — ` +
        `showing the ${wynikAlgorytmu.statystyki.liczbaWynikow} best & most distinct results.`;

    kontenerWynikow.innerHTML = '';
    if (wynikAlgorytmu.wyniki.length === 0) {
        const komunikat = document.createElement('p');
        komunikat.className = 'komunikat-brak-wynikow';
        komunikat.textContent = 'No palettes could be generated — try a different reference color.';
        kontenerWynikow.appendChild(komunikat);
    } else {
        wynikAlgorytmu.wyniki.forEach(({ paleta, wynik }) => {
            kontenerWynikow.appendChild(utworzKarteWyniku(paleta, opisDlaWynikow, wynik));
        });
    }

    sekcjaWynikow.classList.remove('ukryty');
    sekcjaWynikow.scrollIntoView({ behavior: 'smooth', block: 'start' });

    panelWyszukiwania.classList.add('ukryty');
    przyciskWyszukiwania.setAttribute('aria-expanded', 'false');
});

przyciskWyczyscWyniki.addEventListener('click', () => {
    kontenerWynikow.innerHTML = '';
    kontenerOstrzezen.innerHTML = '';
    pigulkiFiltrow.innerHTML = '';
    statystykiGenerowania.textContent = '';
    sekcjaWynikow.classList.add('ukryty');
});


// -13- Sekcja popular right now (placeholder do czasu dodania bazy danych)
const PRZYKLADOWE_POPULARNE_PALETY = [
    { kolory: ['#4b3df5', '#e3e0fd', '#1b2233'], opis: 'Calm, nature, clean' },
    { kolory: ['#155c3b', '#a9f5c9', '#fbf8e3'], opis: 'Fresh, natural, clean' },
    { kolory: ['#5c2a2a', '#f9d7dc', '#c96b74'], opis: 'Warm, romantic, soft' },
    { kolory: ['#161616', '#b3835a', '#5a3a24'], opis: 'Earthy, professional' },
    { kolory: ['#d1651b', '#ecdccb', '#8d7a6b'], opis: 'Warm, energetic, cozy' },
    { kolory: ['#3f8c73', '#eeeeee', '#7a5ea8'], opis: 'Calm, modern, balanced' }
];

function wyrenderujPopularnePalety() {
    kontenerPopularnych.innerHTML = '';
    PRZYKLADOWE_POPULARNE_PALETY.forEach(paleta => {
        kontenerPopularnych.appendChild(utworzProstaKarte(paleta.kolory, paleta.opis));
    });
}

wyrenderujPopularnePalety();

document.addEventListener("DOMContentLoaded", async function () {
    const linkProfilu = document.getElementById("linkProfilu");

    if (!linkProfilu) return;

    try {
        const odpowiedz = await fetch("status_logowania.php");
        if (!odpowiedz.ok) return;

        const dane = await odpowiedz.json();

        if (dane.zalogowany) {
            linkProfilu.textContent = dane.nazwa || "Twój profil";
            linkProfilu.href = "profil.php";
        } else {
            linkProfilu.textContent = "Profil";
            linkProfilu.href = "logowanie.php";
        }
    } catch (blad) {
        console.error("Nie udało się sprawdzić logowania:", blad);
    }
});
