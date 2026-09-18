#!/usr/bin/env bash
# Rafın (main) oyun dallarıyla tutarlı kalıp kalmadığını denetler.
#
# NEDEN VAR: Gamer rutini ayda iki kez yeni bir `oyun/<ad>` dalı açıyor ve
# katalog issue'sunu güncelliyor, ama main'i HİÇ bilmiyor (rutinin prompt'u
# ona yalnız dal + issue yazdırıyor). Yani main'deki oynanabilir kopyalar ve
# index.html, kimse bakmazsa sessizce eskir: yeni oyun rafta görünmez,
# düzeltilmiş bir oyun rafta eski hâliyle oynanır. Bu betik o sessizliği
# bozar — eskimeyi bir CI hatasına çevirir.
#
# İki şeyi denetler:
#   1. Her `oyun/<ad>` dalı için main'de `oyunlar/<ad>/index.html` var mı,
#      ve dalın `oyun-tek-dosya.html` dosyasıyla BİREBİR aynı mı?
#   2. main'de karşılığı olmayan bir oyun klasörü kalmış mı (silinmiş dal)?
#
# Yerelde de aynen çalışır: tools/raf-tazelik.sh
set -uo pipefail

kirmizi=0
bulunan=0

dallar=$(git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/oyun/*' 2>/dev/null)
if [ -z "$dallar" ]; then
  echo "UYARI: hiç 'oyun/*' dalı görünmüyor — tam geçmişle checkout yapıldı mı? (fetch-depth: 0)"
  exit 1
fi

for ref in $dallar; do
  ad="${ref##*/}"
  bulunan=$((bulunan + 1))
  hedef="oyunlar/$ad/index.html"

  if ! git cat-file -e "$ref:oyun-tek-dosya.html" 2>/dev/null; then
    echo "::error::$ref dalında oyun-tek-dosya.html yok — raf kopyası üretilemez."
    kirmizi=1
    continue
  fi

  if [ ! -f "$hedef" ]; then
    echo "::error::$ad oyunu rafta YOK. Eksik dosya: $hedef"
    echo "         Düzeltmek için: git show $ref:oyun-tek-dosya.html > $hedef"
    echo "         ve index.html'e oyunun kartını ekle."
    kirmizi=1
    continue
  fi

  if ! git show "$ref:oyun-tek-dosya.html" | diff -q - "$hedef" >/dev/null; then
    echo "::error::$ad rafta ESKİ. $hedef, $ref dalındaki oyun-tek-dosya.html ile aynı değil."
    echo "         Düzeltmek için: git show $ref:oyun-tek-dosya.html > $hedef"
    kirmizi=1
    continue
  fi

  echo "OK  $ad — raf kopyası dalla birebir aynı"

  if ! grep -q "oyunlar/$ad/index.html" index.html; then
    echo "::error::$ad rafta var ama index.html ondan hiç bahsetmiyor (link yok)."
    kirmizi=1
  fi
done

# Ters yön: dalı olmayan raf klasörü
if [ -d oyunlar ]; then
  for d in oyunlar/*/; do
    [ -d "$d" ] || continue
    ad=$(basename "$d")
    if ! git show-ref --verify --quiet "refs/remotes/origin/oyun/$ad"; then
      echo "::error::oyunlar/$ad var ama 'oyun/$ad' dalı yok — öksüz raf klasörü."
      kirmizi=1
    fi
  done
fi

echo "---"
echo "$bulunan oyun dalı denetlendi."
if [ "$kirmizi" -eq 0 ]; then
  echo "Raf taze."
else
  echo "Raf eskimiş — yukarıdaki satırlar ne yapılacağını söylüyor."
fi
exit "$kirmizi"
